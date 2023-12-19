
import { join, resolve } from "path";
import { readFile } from "fs/promises";

import fsx from "fs-extra";
import pgts from "@appril/pgts";
import { stringify } from "yaml";
import { red } from "kleur/colors";

import type { Plugin, ResolvedConfig } from "vite";

import type {
  ConnectionConfig, PgtsConfig, Config,
  Templates,
  Table,
} from "./@types";

import { BANNER, renderToFile } from "./render";
import { parseFile } from "./ast";

import apiTpl from "./templates/entry/@base/api.tpl";
import apiTypesTpl from "./templates/entry/@base/api-types.tpl";
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

import initIndexTpl from "./templates/entry/index.tpl";

import baseStoreTpl from "./templates/store.tpl";
import baseIndexTpl from "./templates/index.tpl";

const defaultTemplates: Required<Templates> = {
  api: apiTpl,
  apiTypes: apiTypesTpl,
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

export async function vitePluginApprilCrud(
  dbxConfig: DbxConfig,
  crudConfig: Config,
): Promise<Plugin> {

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
    schemas,
  } = await pgts(dbxConfig.connection, {
    ...dbxConfig,
    ...schema
      ? { schemas: [ schema ] }
      : {},
  })

  const watchMap: {
    apiFiles: Record<string, Function>;
    dbxFiles: Record<string, Function>;
    tabFiles: Record<string, Function>;
    tplFiles: Record<string, Function>;
  } = {
    apiFiles: {},
    dbxFiles: {},
    tabFiles: {},
    tplFiles: {},
  }

  const rootPath = (...path: string[]) => resolve(String(process.env.PWD), join(...path))
  const typesPath = (...path: string[]) => rootPath(dbxConfig.base, dbxConfig.typesDir, ...path)
  const tablesPath = (...path: string[]) => rootPath(dbxConfig.base, dbxConfig.tablesDir, ...path)

  const typesImportBase = join(dbxConfig.importBase, dbxConfig.base, dbxConfig.typesDir)
  const tablesImportBase = join(dbxConfig.importBase, dbxConfig.base, dbxConfig.tablesDir)
  const crudDir = join(importBase, outDir)

  const templates = { ...defaultTemplates }

  for (
    const [
      name,
      file,
    ] of Object.entries({ ...crudConfig.templates }) as [
      name: keyof Templates,
      file: string
    ][]
  ) {
    const watchHandler = async () => templates[name] = await readFile(rootPath(file), "utf8")
    watchMap.tplFiles[rootPath(file)] = watchHandler
    await watchHandler()
  }

  // this only generated on start and when new table added
  const generateBaseFiles = async(tables: Table[]) => {

    await renderToFile(rootPath(outDir, "index.ts"), baseIndexTpl, {
      BANNER,
      crudDir,
      typesImportBase,
      tablesImportBase,
      tables,
    })

    await renderToFile(rootPath(outDir, "store.ts"), baseStoreTpl, {
      crudDir,
      typesImportBase,
      tablesImportBase,
      tables,
    }, { overwrite: false })

  }

  // this only generated on start and when new table added
  const generateApiRoutes = async (tables: Table[]) => {

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

    const outFile = rootPath(apiDir, "_000_crud_routes.yml")

    const content = [
      BANNER.trim().replace(/^/gm, "#"),
      stringify(routes),
    ].join("\n")

    await fsx.outputFile(outFile, content, "utf8")

  }

  const generateApiFiles = async (tables: Table[]) => {

    watchMap.apiFiles = {}

    for (const table of tables) {

      const watchHandler = async () => {

        const src = await fsx.pathExists(table.apiFile)
          ? await fsx.readFile(table.apiFile, "utf8")
          : ""

        const apiTypes = parseFile(src)

        for (
          const [ file, tpl ] of [
            [ "api-types.ts", "apiTypes" ],
            [ "handlers.ts", "handlers" ], // handlers needs access to EnvT
          ] satisfies [ file: string, tpl: keyof Templates ][]
        ) {

          const outFile = rootPath(outDir, table.basename, "@base", file)

          await renderToFile(outFile, templates[tpl], {
            BANNER,
            crudDir,
            typesImportBase,
            tablesImportBase,
            apiTypes,
            ...table
          })

        }

      }

      // watching api.ts to know when to regenerate api types and handlers
      watchMap.apiFiles[rootPath(outDir, table.basename, "api.ts")] = watchHandler

      await watchHandler()

    }

  }

  const generateTblFiles = async (tables: Table[]) => {

    watchMap.tabFiles = {}

    for (const table of tables) {

      // this only generated on start and when new table added
      await renderToFile(rootPath(outDir, table.basename, "index.ts"), initIndexTpl, {
        crudDir,
        typesImportBase,
        tablesImportBase,
        ...table
      }, { overwrite: false })

      const watchHandler = async () => {

        for (
          const [ file, tpl ] of [
            [ "api.ts", "api" ],
            [ "base.ts", "base" ],
            [ "ControlButtons.vue", "ControlButtons" ],
            [ "CreateDialog.vue", "CreateDialog" ],
            [ "EditorPlaceholder.vue", "EditorPlaceholder" ],
            // handlers.ts generated by `generateApiFiles`
            [ "index.ts", "index" ],
            [ "Layout.vue", "Layout" ],
            [ "Pager.vue", "Pager" ],
            [ "store.ts", "store" ],
            [ "types.ts", "types" ],
            [ "zod.ts", "zod" ],
          ] satisfies [ file: string, tpl: keyof Templates ][]
        ) {

          const outFile = rootPath(outDir, table.basename, "@base", file)

          await renderToFile(outFile, templates[tpl], {
            BANNER,
            crudDir,
            typesImportBase,
            tablesImportBase,
            ...table
          })

        }

      }

      // table structure reflected in its type file.
      // watching table's type file to know when to regenerate table files
      watchMap.tabFiles[typesPath(table.schema, table.declaredName + ".ts")] = watchHandler

      await watchHandler()

    }

  }

  async function configResolved(
    viteConfig: ResolvedConfig,
  ): Promise<void> {

    watchMap.dbxFiles = {}

    for (const schema of schemas) {

      const watchHandler = async () => {

        const tables: Table[] = []

        for (const table of tableDeclarations.filter((e) => e.schema === schema)) {

          if (!tableFilter || tableFilter(table)) {

            if (!table.primaryKey) {
              console.log(`${ red(table.name) } - no primaryKey defined, skipping...`)
              continue
            }

            tables.push({
              basename: table.name,
              apiBase: join(viteConfig.base, apiDir, outDir, table.name),
              apiFile: rootPath(outDir, table.name, "api.ts"),
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
            tables.push({
              basename: alias,
              apiBase: join(viteConfig.base, apiDir, outDir, alias),
              apiFile: rootPath(outDir, alias, "api.ts"),
              ...table
            })
          }

        }

        await generateBaseFiles(tables)
        await generateApiRoutes(tables)
        await generateApiFiles(tables)
        await generateTblFiles(tables)

      }

      // watching @index.ts and regenerating schema's table files when new table added.
      // TODO?: perhaps detect when table deleted and remove it's files and watchers?
      watchMap.dbxFiles[tablesPath(schema, "@index.ts")] = watchHandler

      await watchHandler()

    }

  }

  // TODO: clean generated files on startup
  // await fsx.remove(rootPath(outDir, "*", "@base"))

  return {

    name: "vite-plugin-appril-crud",

    configResolved,

    configureServer(server) {

      for (const map of Object.values(watchMap)) {
        server.watcher.add(Object.keys(map))
      }

      server.watcher.on("change", async (file) => {

        if (watchMap.tplFiles[file]) {
          await watchMap.tplFiles[file]()
          // regenerating all tables when some template changed
          for (const handler of Object.values(watchMap.tabFiles)) {
            await handler()
          }
        }
        else {

          for (const map of [
            watchMap.apiFiles,
            watchMap.dbxFiles,
            watchMap.tabFiles,
          ]) {
            if (map[file]) {
              await map[file]()
            }
          }

        }

      })

    },

  }

}

