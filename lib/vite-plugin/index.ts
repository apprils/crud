
import { join, resolve } from "path";
import { readFile } from "fs/promises";

import fsx from "fs-extra";
import { stringify } from "yaml";
import pgts from "@appril/pgts";
import { cyan, red } from "kleur/colors";

import type { Plugin, ResolvedConfig } from "vite";

import type { ConnectionConfig, PgtsConfig, Config, Table, Templates } from "./@types";

import componentBaseTpl from "./templates/table/@component/base.tpl";
import componentStoreTpl from "./templates/table/@component/store.tpl";
import componentHandlersTpl from "./templates/table/@component/handlers.tpl";
import componentTypesTpl from "./templates/table/@component/types.tpl";
import componentLayoutTpl from "./templates/table/@component/Layout.tpl";
import componentPagerTpl from "./templates/table/@component/Pager.tpl";
import componentControlButtonsTpl from "./templates/table/@component/ControlButtons.tpl";
import componentCreateDialogTpl from "./templates/table/@component/CreateDialog.tpl";
import componentEditorPlaceholderTpl from "./templates/table/@component/EditorPlaceholder.tpl";

import tableTypesTpl from "./templates/table/types.tpl";
import tableIndexTpl from "./templates/table/index.tpl";

import $OverlayTpl from "./templates/Overlay.tpl";
import $typesTpl from "./templates/types.tpl";
import $storeTpl from "./templates/store.tpl";
import $zodTpl from "./templates/zod.tpl";

import apiIndexTpl from "./templates/api/index.tpl";

import { BANNER, renderToFile } from "./render";

const defaultTemplates: Required<Templates> & {
  tableTypes: string;
  tableIndex: string;
  $Overlay: string;
  $types: string;
  $store: string;
  $zod: string;
} = {
  base: componentBaseTpl,
  store: componentStoreTpl,
  handlers: componentHandlersTpl,
  types: componentTypesTpl,
  Layout: componentLayoutTpl,
  Pager: componentPagerTpl,
  ControlButtons: componentControlButtonsTpl,
  CreateDialog: componentCreateDialogTpl,
  EditorPlaceholder: componentEditorPlaceholderTpl,
  tableTypes: tableTypesTpl,
  tableIndex: tableIndexTpl,
  $Overlay: $OverlayTpl,
  $types: $typesTpl,
  $store: $storeTpl,
  $zod: $zodTpl,
}

type TemplateName = keyof typeof defaultTemplates
type TemplateMap = Record<TemplateName, string>

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

    const templates: TemplateMap = { ...defaultTemplates }

    for (const [ name, file ] of Object.entries({ ...crudConfig.templates })) {
      templates[name as TemplateName] = await readFile(rootPath(file), "utf8")
    }

    const tables: Table[] = tableDeclarations.flatMap((table) => {

      if (tableFilter && !tableFilter(table)) {
        return []
      }

      if (!table.primaryKey) {
        console.log(` - No primaryKey defined for ${ red(table.name) } table, skipping...`)
        return []
      }

      return [{
        ...table,
        apiName: join(apiBase, table.name),
        apiBase: join(apiBase, table.name),
      }]

    })

    for (const table of tables) {

      for (const [ file, tpl ] of [
        [ "types.ts", "tableTypes" ],
      ] satisfies [ file: string, tpl: TemplateName ][]) {

        await renderToFile(uixPath(table.name, file), templates[tpl], {
          crudDir,
          typesDir,
          tablesDir,
          ...table,
        }, { overwrite: false })

      }

      await renderToFile(uixPath(table.name, "index.ts"), templates.tableIndex, {
        BANNER,
          crudDir,
        typesDir,
        tablesDir,
        ...table,
      })

      for (
        const [ file, tpl ] of [
          [ "base.ts", "base" ],
          [ "store.ts", "store" ],
          [ "handlers.ts", "handlers" ],
          [ "types.ts", "types" ],
          [ "Layout.vue", "Layout" ],
          [ "Pager.vue", "Pager" ],
          [ "ControlButtons.vue", "ControlButtons" ],
          [ "CreateDialog.vue", "CreateDialog" ],
          [ "EditorPlaceholder.vue", "EditorPlaceholder" ],
        ] satisfies [ file: string, tpl: TemplateName ][]
      ) {

        await renderToFile(uixPath(table.name, "@component", file), templates[tpl], {
          BANNER,
          crudDir,
          typesDir,
          tablesDir,
          ...table,
        })

      }

    }

    for (
      const [ file, tpl ] of [
        [ "store.ts", "$store" ],
      ] satisfies [ file: string, tpl: TemplateName ][]
    ) {

      await renderToFile(uixPath(file), templates[tpl], {
        tables,
        crudDir,
        typesDir,
        tablesDir,
      }, { overwrite: false })

    }

    for (
      const [ file, tpl ] of [
        [ "Overlay.vue", "$Overlay" ],
        [ "types.ts", "$types" ],
        [ "zod.ts", "$zod" ],
      ] satisfies [ file: string, tpl: TemplateName ][]
    ) {

      await renderToFile(uixPath(file), templates[tpl], {
        BANNER,
        tables,
        crudDir,
        typesDir,
        tablesDir,
      })

    }

    await renderToFile(apiPath("index.ts"), apiIndexTpl, {
      BANNER,
      tables,
      crudDir,
      typesDir,
      tablesDir,
    })

    {

      const routes: Record<string, {
        name: string;
        declaredName: string;
        varName: string;
        template: string;
        meta: Record<string, any>;
      }> = {}

      for (const table of tables) {
        routes[join(table.apiBase, "/")] = {
          name: table.apiName,
          declaredName: table.declaredName,
          varName: table.varName,
          template: resolve(__dirname, "templates/api/route.tpl"),
          meta: typeof meta === "function"
            ? meta(table)
            : { ...meta?.[table.name] || meta?.["*"] },
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

    name: "vite-plugin-dbx-crud",

    configResolved: generateFiles,

    configureServer(server) {

      // adding optedTemplates to watchlist

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

