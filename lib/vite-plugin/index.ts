
import { join, resolve } from "path";
import { readFile } from "fs/promises";

import fsx from "fs-extra";
import { stringify } from "yaml";
import pgts from "@appril/pgts";
import { cyan, red } from "kleur/colors";

import type { Plugin, ResolvedConfig } from "vite";

import type {
  ConnectionConfig, PgtsConfig, Config,
  Templates, ApiTemplates,
  Table,
} from "./@types";

import baseTpl from "./templates/client/@base/base.tpl";
import ControlButtonsTpl from "./templates/client/@base/ControlButtons.tpl";
import CreateDialogTpl from "./templates/client/@base/CreateDialog.tpl";
import EditorPlaceholderTpl from "./templates/client/@base/EditorPlaceholder.tpl";
import handlersTpl from "./templates/client/@base/handlers.tpl";
import indexTpl from "./templates/client/@base/index.tpl";
import LayoutTpl from "./templates/client/@base/Layout.tpl";
import PagerTpl from "./templates/client/@base/Pager.tpl";
import storeTpl from "./templates/client/@base/store.tpl";
import typesTpl from "./templates/client/@base/types.tpl";
import zodTpl from "./templates/client/@base/zod.tpl";

import initTypesTpl from "./templates/client/types.tpl";
import initIndexTpl from "./templates/client/index.tpl";
import initStoreTpl from "./templates/client/store.tpl";

import apiBaseIndexTpl from "./templates/api/@base/index.tpl";

import { BANNER, renderToFile } from "./render";

const defaultClientTemplates: Required<Templates> = {
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

const defaultApiTemlates: Required<ApiTemplates> = {
  index: apiBaseIndexTpl,
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

    const apiBase = (
      "apiBase" in crudConfig
        ? crudConfig.apiBase + "/"
        : outDir + "/"
    ).replace(/^\/+$/, "")

    const uixPath = (...path: string[]) => rootPath(outDir, join(...path))
    const apiPath = (...path: string[]) => rootPath(apiDir, apiBase, join(...path))

    const typesDir = join(dbxConfig.importBase, dbxConfig.base, dbxConfig.typesDir)
    const tablesDir = join(dbxConfig.importBase, dbxConfig.base, dbxConfig.tablesDir)
    const crudDir = join(importBase, outDir)

    const clientTemplates = { ...defaultClientTemplates }
    const apiTemplates = { ...defaultApiTemlates }

    for (const [ name, file ] of Object.entries({ ...crudConfig.templates }) as [ name: keyof Templates, file: string ][]) {
      clientTemplates[name] = await readFile(rootPath(file), "utf8")
    }

    for (const [ name, file ] of Object.entries({ ...crudConfig.apiTemplates }) as [ name: keyof ApiTemplates, file: string ][]) {
      apiTemplates[name] = await readFile(rootPath(file), "utf8")
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
          apiBase: join(apiBase, table.name),
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
          apiBase: join(apiBase, alias),
          ...table
        })
      }

      return entries

    })

    await renderToFile(uixPath("store.ts"), initStoreTpl, {
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

        await renderToFile(uixPath(table.basename, file), tpl, {
          crudDir,
          typesDir,
          tablesDir,
          ...table
        }, { overwrite: false })

      }

      for (
        const [ file, tpl ] of [
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

        await renderToFile(uixPath(table.basename, "@base", file), clientTemplates[tpl], {
          BANNER,
          crudDir,
          typesDir,
          tablesDir,
          ...table
        })

      }

      for (
        const [ file, tpl ] of [
          [ "index.ts", "index" ],
        ] satisfies [ file: string, tpl: keyof ApiTemplates ][]
      ) {

        await renderToFile(apiPath(table.basename, "@base", file), apiTemplates[tpl], {
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
        template: string;
        meta: Record<string, any>;
      }> = {}

      for (const table of tables) {
        routes[join(table.apiBase, "/")] = {
          name: table.apiBase,
          template: resolve(__dirname, "templates/api/index.tpl"),
          meta: typeof meta === "function"
            ? meta(table)
            : { ...meta?.[table.basename] || meta?.["*"] },
        }
      }

      const content = [
        BANNER.trim().replace(/^/gm, "#"),
        stringify(routes),
      ].join("\n")

      await fsx.outputFile(apiPath("_routes.yml"), content, "utf8")

    }

  }

  return {

    name: "vite-plugin-appril-crud",

    configResolved: generateFiles,

    configureServer(server) {

      // adding custom templates to watchlist

      const watchedFiles = [
        ...Object.values(crudConfig.templates || {}),
        ...Object.values(crudConfig.apiTemplates || {}),
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

