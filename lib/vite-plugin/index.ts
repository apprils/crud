
import { join, resolve } from "path";
import { readFile } from "fs/promises";

import fsx from "fs-extra";
import { stringify } from "yaml";
import pgts from "@appril/pgts";
import { cyan, red } from "kleur/colors";

import type { Plugin, ResolvedConfig } from "vite";

import type {
  ConnectionConfig, PgtsConfig, Config,
  Templates,
  Table,
} from "./@types";

import apiTpl from "./templates/entry/@base/api.tpl";
import baseTpl from "./templates/entry/@base/base.tpl";
import ControlButtonsTpl from "./templates/entry/@base/ControlButtons.tpl";
import CreateDialogTpl from "./templates/entry/@base/CreateDialog.tpl";
import EditorPlaceholderTpl from "./templates/entry/@base/EditorPlaceholder.tpl";
import handlersTpl from "./templates/entry/@base/handlers.tpl";
import indexTpl from "./templates/entry/@base/index.tpl";
import LayoutTpl from "./templates/entry/@base/Layout.tpl";
import PagerTpl from "./templates/entry/@base/Pager.tpl";
import storeTpl from "./templates/entry/@base/store.tpl";
import typesTpl from "./templates/entry/@base/types.tpl";
import zodTpl from "./templates/entry/@base/zod.tpl";

import initTypesTpl from "./templates/entry/types.tpl";
import initIndexTpl from "./templates/entry/index.tpl";

import clientStoreTpl from "./templates/store.tpl";
import clientIndexTpl from "./templates/index.tpl";

import { BANNER, renderToFile } from "./render";

const defaultTemplates: Required<Templates> = {
  api: apiTpl,
  base: baseTpl,
  ControlButtons: ControlButtonsTpl,
  CreateDialog: CreateDialogTpl,
  EditorPlaceholder: EditorPlaceholderTpl,
  handlers: handlersTpl,
  index: indexTpl,
  Layout: LayoutTpl,
  Pager: PagerTpl,
  store: storeTpl,
  types: typesTpl,
  zod: zodTpl,
}

type DbxConfig = PgtsConfig & {
  connection: string | ConnectionConfig;
  base: string;
  importBase: string;
  typesDir: string;
  tablesDir: string;
}

export function vitePluginApprilCrud(
  dbxConfig: DbxConfig,
  crudConfig: Config,
): Plugin {

  async function generateFiles(
    viteConfig: ResolvedConfig,
  ): Promise<void> {

    console.log(`[ ${ cyan("Generating CRUD adapters...") } ]`)

    const rootPath = (...path: string[]) => resolve(viteConfig.root, join(...path))

    const {
      schema,
      outDir,
      apiDir = "api",
      importBase = "@",
      alias = {},
      tableFilter,
      meta,
    } = crudConfig

    const {
      tables: tableDeclarations,
    } = await pgts(dbxConfig.connection, {
      ...dbxConfig,
      ...schema
        ? { schemas: [ schema ] }
        : {},
    })

    const typesDir = join(dbxConfig.importBase, dbxConfig.base, dbxConfig.typesDir)
    const tablesDir = join(dbxConfig.importBase, dbxConfig.base, dbxConfig.tablesDir)
    const crudDir = join(importBase, outDir)

    const templates = { ...defaultTemplates }

    for (const [ name, file ] of Object.entries({ ...crudConfig.templates }) as [ name: keyof Templates, file: string ][]) {
      templates[name] = await readFile(rootPath(file), "utf8")
    }

    const tables: Table[] = tableDeclarations.flatMap((table) => {

      const entries: Table[] = []

      if (!tableFilter || tableFilter(table)) {

        if (!table.primaryKey) {
          console.log(` - No primaryKey defined for ${ red(table.name) } table, skipping...`)
          return []
        }

        entries.push({
          basename: table.name,
          apiBase: join(viteConfig.base, apiDir, outDir, table.name),
          ...table
        })

      }

      const aliasNames: string[] = []

      if (typeof alias[table.name] === "string") {
        aliasNames.push(alias[table.name] as string)
      }
      else if (Array.isArray(alias[table.name])) {
        aliasNames.push(...alias[table.name] as string[])
      }

      for (const alias of aliasNames) {
        entries.push({
          basename: alias,
          apiBase: join(viteConfig.base, apiDir, outDir, alias),
          ...table
        })
      }

      return entries

    })

    await renderToFile(rootPath(outDir, "index.ts"), clientIndexTpl, {
      BANNER,
      crudDir,
      typesDir,
      tablesDir,
      tables,
    })

    await renderToFile(rootPath(outDir, "store.ts"), clientStoreTpl, {
      crudDir,
      typesDir,
      tablesDir,
      tables,
    }, { overwrite: false })

    for (const table of tables) {

      for (
        const [ file, tpl ] of [
          [ "index.ts", initIndexTpl ],
          [ "types.ts", initTypesTpl ],
        ]
      ) {

        await renderToFile(rootPath(outDir, table.basename, file), tpl, {
          crudDir,
          typesDir,
          tablesDir,
          ...table
        }, { overwrite: false })

      }

      for (
        const [ file, tpl ] of [
          [ "api.ts", "api" ],
          [ "base.ts", "base" ],
          [ "ControlButtons.vue", "ControlButtons" ],
          [ "CreateDialog.vue", "CreateDialog" ],
          [ "EditorPlaceholder.vue", "EditorPlaceholder" ],
          [ "handlers.ts", "handlers" ],
          [ "index.ts", "index" ],
          [ "Layout.vue", "Layout" ],
          [ "Pager.vue", "Pager" ],
          [ "store.ts", "store" ],
          [ "types.ts", "types" ],
          [ "zod.ts", "zod" ],
        ] satisfies [ file: string, tpl: keyof Templates ][]
      ) {

        await renderToFile(rootPath(outDir, table.basename, "@base", file), templates[tpl], {
          BANNER,
          crudDir,
          typesDir,
          tablesDir,
          ...table
        })

      }

    }

    {

      const routes: Record<string, {
        name: string;
        file: string;
        template: string;
        meta: Record<string, any>;
      }> = {}

      for (const table of tables) {

        const base = join(outDir, table.basename)

        routes[base] = {
          name: base,
          file: join(base, "api.ts"),
          template: resolve(__dirname, "templates/api.tpl"),
          meta: typeof meta === "function"
            ? meta(table)
            : { ...meta?.["*"], ...meta?.[table.basename] },
        }

      }

      const content = [
        BANNER.trim().replace(/^/gm, "#"),
        stringify(routes),
      ].join("\n")

      await fsx.outputFile(rootPath(apiDir, "_000_crud_routes.yml"), content, "utf8")

    }

  }

  return {

    name: "vite-plugin-appril-crud",

    configResolved: generateFiles,

    configureServer(server) {

      // adding custom templates to watchlist

      const watchedFiles = [
        ...Object.values(crudConfig.templates || {}),
      ]

      if (watchedFiles.length) {

        server.watcher.add(watchedFiles)

        server.watcher.on("change", function(file) {
          if (watchedFiles.some((path) => file.includes(path))) {
            return generateFiles(server.config)
          }
        })

      }

    },

  }

}

