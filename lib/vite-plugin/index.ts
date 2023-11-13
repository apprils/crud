
import { join, resolve } from "path";
import { readFile } from "fs/promises";

import fsx from "fs-extra";
import { stringify } from "yaml";
import pgts from "@appril/pgts";
import { cyan, red } from "kleur/colors";

import type { Plugin, ResolvedConfig } from "vite";

import type { ConnectionConfig, PgtsConfig, Config, Table, Templates } from "./@types";

import indexTpl from "./templates/table/index.tpl";
import baseTpl from "./templates/table/base.tpl";
import handlersTpl from "./templates/table/handlers.tpl";
import storeTpl from "./templates/table/store.tpl";
import extraTpl from "./templates/table/extra.tpl";
import typesTpl from "./templates/table/types.tpl";
import LayoutTpl from "./templates/table/Layout.tpl";
import PagerTpl from "./templates/table/Pager.tpl";
import ControlButtonsTpl from "./templates/table/ControlButtons.tpl";
import CreateDialogTpl from "./templates/table/CreateDialog.tpl";
import EditorPlaceholderTpl from "./templates/table/EditorPlaceholder.tpl";

import $OverlayTpl from "./templates/Overlay.tpl";
import $typesTpl from "./templates/types.tpl";
import $zodTpl from "./templates/zod.tpl";

import $storeActionListenersTpl from "./templates/@store/action-listeners.tpl";
import $storeActionsTpl from "./templates/@store/actions.tpl";
import $storeGettersTpl from "./templates/@store/getters.tpl";

import apiIndexTpl from "./templates/api/index.tpl";

import { BANNER, renderToFile } from "./render";

const defaultTemplates: Required<Templates> & {
  $Overlay: string;
  $types: string;
  $zod: string;
  $storeActionListeners: string;
  $storeActions: string;
  $storeGetters: string;
} = {
  index: indexTpl,
  base: baseTpl,
  store: storeTpl,
  handlers: handlersTpl,
  extra: extraTpl,
  types: typesTpl,
  Layout: LayoutTpl,
  Pager: PagerTpl,
  ControlButtons: ControlButtonsTpl,
  CreateDialog: CreateDialogTpl,
  EditorPlaceholder: EditorPlaceholderTpl,
  $Overlay: $OverlayTpl,
  $types: $typesTpl,
  $zod: $zodTpl,
  $storeActionListeners: $storeActionListenersTpl,
  $storeActions: $storeActionsTpl,
  $storeGetters: $storeGettersTpl,
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

      await renderToFile(uixPath("@extra", table.name + ".ts"), templates.extra, {
        typesDir,
        tablesDir,
        ...table,
      }, { overwrite: false })

      for (
        const [ file, tpl ] of [
          [ "index.ts", "index" ],
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

        await renderToFile(uixPath(table.name, file), templates[tpl], {
          BANNER,
          typesDir,
          tablesDir,
          ...table,
        })

      }

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
        typesDir,
        tablesDir,
      })

    }

    for (
      const [ file, tpl ] of [
        [ "action-listeners.ts", "$storeActionListeners" ],
        [ "actions.ts", "$storeActions" ],
        [ "getters.ts", "$storeGetters" ],
      ] satisfies [ file: string, tpl: TemplateName ][]
    ) {

      await renderToFile(uixPath("@store", file), templates[tpl], {
        tables,
        typesDir,
        tablesDir,
      }, { overwrite: false })

    }

    await renderToFile(apiPath("index.ts"), apiIndexTpl, {
      BANNER,
      tables,
      typesDir,
      tablesDir,
      crudDir,
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

      // adding optedTemplates and extraFiles templates to watchlist

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

