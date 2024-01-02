
import { join, resolve, dirname, basename } from "path";
import { readFile } from "fs/promises";

import fsx from "fs-extra";
import pgts from "@appril/pgts";
import { transform } from "esbuild";
import { stringify } from "yaml";
import { red } from "kleur/colors";

import type { Plugin, ResolvedConfig } from "vite";

import type {
  ConnectionConfig, PgtsConfig, Config,
  ClientModuleTemplates, Table, TableDeclaration,
  AVFactoryModuleName, AVTsModuleName, AVVueModuleName,
  AVModuleMap, AVModule,
} from "./@types";

import type { ApiTypes } from "../client/@types";

import {
  clientTemplatesFactory, factoryTemplatesFactory,
  apiTemplatesFactory, extraTemplatesFactory,
} from "./templates";

import { BANNER, renderToFile, render } from "./render";
import { extractTypes } from "./ast";

const clientTemplates = clientTemplatesFactory()
const factoryTemplates = factoryTemplatesFactory()
const apiTemplates = apiTemplatesFactory()
const extraTemplates = extraTemplatesFactory()

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
    base,
    apiDir = "api",
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
    tplFiles: Record<string, Function>;
    dbxFiles: Record<string, Function>;
    apiFiles: Record<string, Function>;
  } = {
    tplFiles: {},
    dbxFiles: {},
    apiFiles: {},
  }

  const rootPath = (...path: string[]) => resolve(String(process.env.PWD), join(...path))
  const tablesPath = (...path: string[]) => rootPath(dbxConfig.base, dbxConfig.tablesDir, ...path)

  const sourceFolder = basename(rootPath())
  const typesImportBase = join(dbxConfig.importBase, dbxConfig.base, dbxConfig.typesDir)
  const tablesImportBase = join(dbxConfig.importBase, dbxConfig.base, dbxConfig.tablesDir)

  const templates = { ...clientTemplates }

  for (
    const [
      name,
      file,
    ] of Object.entries({ ...crudConfig.templates }) as [
      name: keyof ClientModuleTemplates,
      file: string
    ][]
  ) {
    // watching custom templates for updates
    watchMap.tplFiles[rootPath(file)] = async () => {
      templates[name] = await readFile(rootPath(file), "utf8")
    }
  }

  const avModules = {} as AVModuleMap

  for (
    const [
      name,
      code
    ] of Object.entries(factoryTemplates) as [
      name: AVFactoryModuleName,
      code: string
    ][]
  ) {
    avModules[name] = {
      id: name,
      name,
      ambientCode: code,
      virtualCode: code,
    }
  }

  const generateApiFiles = async (
    tables: Table[],
  ) => {

    const routes: Record<string, {
      name: string;
      file: string;
      template: string;
      meta: Record<string, any>;
    }> = {}

    for (const table of tables) {

      routes[table.apiPath] = {
        name: table.apiPath,
        file: table.apiFile,
        template: resolve(__dirname, "templates/api/route.tpl"),
        meta: typeof meta === "function"
          ? meta(table)
          : { ...meta?.["*"], ...meta?.[table.basename] },
      }

      // watching api file to get apiTypes updates
      watchMap.apiFiles[rootPath(table.apiFile)] = async () => {

        // apiTypes used by multiple table modules
        // so regenerating all table modules
        await generateAmbientVirtualModules(table)

      }

    }

    {

      // not creating route file directly,
      // rather adding a coresponding entry to yml file
      // and file will be created by api plugin

      const outFile = rootPath(apiDir, `_000_${ base }_routes.yml`)

      const content = [
        BANNER.trim().replace(/^/gm, "#"),
        stringify(routes),
      ].join("\n")

      await fsx.outputFile(outFile, content, "utf8")

    }

    {

      // generating a bundle file containing api constructors for all tables
      await renderToFile(rootPath(apiDir, base, "index.ts"), apiTemplates.constructors, {
        BANNER,
        typesImportBase,
        tablesImportBase,
        tables,
        factoryCode: apiTemplates.factory,
      })

    }

  }

  const generateAmbientVirtualModules = async (
    table: Table,
  ) => {

    const prefix = [ base, table.basename ].join(":")

    const apiTypes = extractTypes(
      await fsx.readFile(rootPath(table.apiFile), "utf8"),
      { root: sourceFolder, base: dirname(table.apiFile) }
    )

    const moduleFactory = (
      tpl: keyof ClientModuleTemplates,
    ): AVModule => {

      let virtualCode = templates[tpl].replace(
        /@crud:virtual-module-placeholder/g,
        prefix
      )

      // do not render templates/client/_* files, they contain no mustache code!
      // rendering them would break vue templates!
      // only 2 templates contains mustache code - assets.ts and apiTypes.ts,
      // and templates/client/_* files imports them for module static data.
      if (tpl === "assets.ts" || tpl === "apiTypes.ts") {

        const context: Record<string, any> = {
          apiTypes,
        }

        if (tpl === "assets.ts") {
          const { EnvT, ItemAssetsT } = apiTypes
          context.apiTypesLiteral = JSON.stringify({ EnvT, ItemAssetsT } satisfies ApiTypes)
        }

        virtualCode = render(virtualCode, {
          typesImportBase,
          tablesImportBase,
          ...table,
          ...context,
        })

      }

      const ambientCode = /\.vue$/.test(tpl)
        ? `export { default } from "${ prefix }/${ tpl }.d.ts";`
        : virtualCode

      return {
        get id() { return join(prefix, this.name) },
        get name() {

          if (tpl === "index.ts") {
            return ""
          }

          if (/\.vue/.test(tpl)) { // keeping .vue and .vue.d.ts extensions
            return tpl as AVVueModuleName
          }

          return tpl.replace(/\.ts$/, "") as AVTsModuleName

        },
        ambientCode,
        virtualCode,
      }

    }

    for (const tpl of Object.keys(clientTemplates) as (keyof ClientModuleTemplates)[]) {
      const mdl = moduleFactory(tpl)
      avModules[mdl.id] = mdl
    }

    // regenerating whole bundle, even if single table updated
    await renderToFile(
      rootPath(base + ".d.ts"),
      extraTemplates.moduleDts,
      {
        BANNER,
        avModules: Object.values(avModules),
      }
    )

  }

  async function configResolved(
    viteConfig: ResolvedConfig,
  ) {

    const apiAssets = {
      apiPath: {
        get(this: Table) { return join(base, this.basename) },
        enumerable: true,
      },
      apiBase: {
        get(this: Table) { return join(viteConfig.base, apiDir, this.apiPath) },
        enumerable: true,
      },
      apiFile: {
        get(this: Table) { return join(apiDir, this.apiPath, "index.ts") },
        enumerable: true,
      },
    }

    const tableFlatMapper = (
      table: TableDeclaration
    ): Table[] => {

      const tables: Table[] = []

      if (!tableFilter || tableFilter(table)) {

        if (!table.primaryKey) {
          console.log(`${ red(table.name) } - no primaryKey defined, skipping...`)
          return []
        }

        tables.push(
          Object.defineProperties(
            { ...table, basename: table.name },
            apiAssets,
          ) as Table
        )

      }

      const aliasNames: string[] = []

      if (typeof alias[table.name] === "string") {
        aliasNames.push(alias[table.name] as string)
      }
      else if (Array.isArray(alias[table.name])) {
        aliasNames.push(...alias[table.name] as string[])
      }

      for (const basename of aliasNames) {

        tables.push(
          Object.defineProperties(
            { ...table, basename },
            apiAssets,
          ) as Table
        )

      }

      return tables

    }

    for (const schema of schemas) {

      // regenerating schema's tables files/modules when new table added.
      // tables/{schema}/@index.ts is a bundle file containing all tables in a schema.
      // watching it to know when new table added.
      watchMap.dbxFiles[
        tablesPath(schema, "@index.ts")
      ] = async () => {

        const tables = tableDeclarations
          .filter((e) => e.schema === schema)
          .flatMap(tableFlatMapper)

        await generateApiFiles(tables)

        // do not call generateAmbientVirtualModules here,
        // it is called by watchMap.apiFiles

      }

    }

    for (
      const handlerMap of [ // 000 keep the order!
        watchMap.tplFiles,  // 001
        watchMap.dbxFiles,  // 002
        watchMap.apiFiles,  // 003
      ]
    ) {
      for (const handler of Object.values(handlerMap)) {
        await handler()
      }
    }

  }

  return {

    name: "vite-plugin-appril-crud",

    resolveId(id) {
      if (avModules[id]) {
        return id
      }
    },

    load(id) {
      if (avModules[id]) {
        return {
          code: avModules[id].virtualCode,
          map: null,
        }
      }
    },

    transform(src, id) {
      if (avModules[id]) {
        return transform(src, {
          loader: "ts",
        })
      }
    },

    configResolved,

    configureServer(server) {

      for (const handlerMap of Object.values(watchMap)) {
        server.watcher.add(Object.keys(handlerMap))
      }

      server.watcher.on("change", async (file) => {

        if (watchMap.tplFiles[file]) {
          await watchMap.tplFiles[file]()
          // regenerating everything when some template updated
          for (
            const handler of [
              ...Object.values(watchMap.dbxFiles),
              ...Object.values(watchMap.apiFiles),
            ]
          ) {
            await handler()
          }
        }
        else {

          for (const map of [
            watchMap.dbxFiles,
            watchMap.apiFiles,
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

