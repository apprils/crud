import { join, resolve, dirname, basename } from "path";
import { readFile } from "fs/promises";

import fsx from "fs-extra";
import pgts from "@appril/pgts";
import { transform } from "esbuild";
import { stringify } from "yaml";

import type { Plugin, ResolvedConfig } from "vite";

import type {
  ConnectionConfig,
  PgtsConfig,
  Config,
  ClientModuleTemplates,
  Table,
  TableDeclaration,
  AVFactoryModuleName,
  AVTsModuleName,
  AVVueModuleName,
  AVModuleMap,
  AVModule,
} from "./@types";

import type { ApiTypesLiteral } from "../client/@types";

import {
  clientTemplatesFactory,
  factoryTemplatesFactory,
  apiTemplatesFactory,
  extraTemplatesFactory,
} from "./templates";

import { resolvePath, filesGeneratorFactory } from "./base";
import { BANNER, render } from "./render";
import { extractTypes } from "./ast";

const clientTemplates = clientTemplatesFactory();
const factoryTemplates = factoryTemplatesFactory();
const apiTemplates = apiTemplatesFactory();
const extraTemplates = extraTemplatesFactory();

type DbxConfig = PgtsConfig & {
  connection: string | ConnectionConfig;
  base: string;
};

const PLUGIN_NAME = "@appril:crudPlugin";

export async function crudPlugin(
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
  } = crudConfig;

  const { tables } = await pgts(dbxConfig.connection, {
    ...dbxConfig,
    ...(schema ? { schemas: [schema] } : {}),
  });

  const watchMap: {
    tplFiles: Record<string, () => Promise<void>>;
    dbxFiles: Record<string, () => Promise<void>>;
    apiFiles: Record<string, () => Promise<void>>;
  } = {
    tplFiles: {},
    dbxFiles: {},
    apiFiles: {},
  };

  const sourceFolder = basename(resolvePath());

  const templates = { ...clientTemplates };

  for (const [name, file] of Object.entries({ ...crudConfig.templates }) as [
    name: keyof ClientModuleTemplates,
    file: string,
  ][]) {
    // watching custom templates for updates
    watchMap.tplFiles[resolvePath(file)] = async () => {
      templates[name] = await readFile(resolvePath(file), "utf8");
    };
  }

  const avModules = {} as AVModuleMap;

  for (const [name, code] of Object.entries(factoryTemplates) as [
    name: AVFactoryModuleName,
    code: string,
  ][]) {
    avModules[name] = {
      id: name,
      name,
      ambientCode: code,
      virtualCode: code,
    };
  }

  async function configResolved(viteConfig: ResolvedConfig) {
    const filesGenerator = filesGeneratorFactory(viteConfig);

    const generateApiFiles = async (tables: Table[]) => {
      const routes: Record<
        string,
        {
          name: string;
          basename: string;
          file: string;
          template: string;
          meta: Record<string, unknown>;
        }
      > = {};

      for (const table of tables) {
        routes[table.apiPath] = {
          name: table.apiPath,
          basename: table.basename,
          file: table.apiFile,
          template: resolve(__dirname, "vite-plugin/templates/api/route.tpl"),
          meta:
            typeof meta === "function"
              ? meta(table)
              : { ...meta?.["*"], ...meta?.[table.basename] },
        };

        // watching api file to get apiTypes updates
        watchMap.apiFiles[resolvePath(table.apiFile)] = async () => {
          // apiTypes used by multiple table modules
          // so regenerating all table modules
          await generateAmbientVirtualModules(table);
        };
      }

      {
        // not creating route file directly,
        // rather adding a corresponding entry to yml file
        // and file will be created by api plugin

        const content = [
          BANNER.trim().replace(/^/gm, "#"),
          stringify(routes),
        ].join("\n");

        await filesGenerator.generateFile(
          join(apiDir, `_000_${base}_routes.yml`),
          content,
        );
      }

      // generating a bundle file containing api constructors for all tables
      await filesGenerator.generateFile(join(apiDir, base, "index.ts"), {
        template: apiTemplates.constructors,
        context: {
          BANNER,
          sourceFolder,
          dbxConfig,
          tables,
          factoryCode: apiTemplates.factory,
        },
      });
    };

    const generateAmbientVirtualModules = async (table: Table) => {
      const prefix = [base, table.basename].join(":");

      const apiTypes = extractTypes(
        await fsx.readFile(resolvePath(table.apiFile), "utf8"),
        { root: sourceFolder, base: dirname(table.apiFile) },
      );

      const moduleFactory = (tpl: keyof ClientModuleTemplates): AVModule => {
        let virtualCode = templates[tpl].replace(
          /@crud:virtual-module-placeholder/g,
          prefix,
        );

        // do not render templates/client/_* files, they contain no mustache code!
        // rendering them would break vue templates!
        // only 2 templates contains mustache code - assets.ts and apiTypes.ts,
        if (tpl === "assets.ts" || tpl === "apiTypes.ts") {
          const context: Record<string, unknown> = {
            apiTypes,
          };

          if (tpl === "assets.ts") {
            const apiTypesLiteral: ApiTypesLiteral = {
              EnvT: false,
              ListAssetsT: false,
              ItemAssetsT: false,
            };

            for (const key of Object.keys(
              apiTypesLiteral,
            ) as (keyof ApiTypesLiteral)[]) {
              apiTypesLiteral[key] = key in apiTypes;
            }

            context.apiTypesLiteral = JSON.stringify(apiTypesLiteral);
          }

          virtualCode = render(virtualCode, {
            dbxConfig,
            ...table,
            ...context,
          });
        }

        const ambientCode = /\.vue$/.test(tpl)
          ? `export { default } from "${prefix}/${tpl}.d.ts";`
          : virtualCode;

        return {
          get id() {
            return join(prefix, this.name);
          },
          get name() {
            if (tpl === "index.ts") {
              return "";
            }

            if (/\.vue/.test(tpl)) {
              // keeping .vue and .vue.d.ts extensions
              return tpl as AVVueModuleName;
            }

            return tpl.replace(/\.ts$/, "") as AVTsModuleName;
          },
          ambientCode,
          virtualCode,
        };
      };

      for (const tpl of Object.keys(
        clientTemplates,
      ) as (keyof ClientModuleTemplates)[]) {
        const mdl = moduleFactory(tpl);
        avModules[mdl.id] = mdl;
      }

      // regenerating whole bundle, even if single table updated
      await filesGenerator.generateFile(`${base}.d.ts`, {
        template: extraTemplates.moduleDts,
        context: {
          BANNER,
          avModules: Object.values(avModules),
        },
      });
    };

    const apiAssets = {
      apiPath: {
        get(this: Table) {
          return join(base, this.basename);
        },
        enumerable: true,
      },
      apiBase: {
        get(this: Table) {
          return join(viteConfig.base, apiDir, this.apiPath);
        },
        enumerable: true,
      },
      apiFile: {
        get(this: Table) {
          return join(apiDir, this.apiPath, "index.ts");
        },
        enumerable: true,
      },
    };

    const tableFlatMapper = (table: TableDeclaration): Table[] => {
      const tables: Table[] = [];

      if (!tableFilter || tableFilter(table)) {
        if (!table.primaryKey) {
          console.log(`[ ${table.name} ] - no primaryKey defined, skipping...`);
          return [];
        }

        tables.push(
          Object.defineProperties(
            { ...table, basename: table.name },
            apiAssets,
          ) as Table,
        );
      }

      const aliasNames: string[] = [];

      if (typeof alias[table.name] === "string") {
        aliasNames.push(alias[table.name] as string);
      } else if (Array.isArray(alias[table.name])) {
        aliasNames.push(...(alias[table.name] as string[]));
      }

      for (const basename of aliasNames) {
        tables.push(
          Object.defineProperties({ ...table, basename }, apiAssets) as Table,
        );
      }

      return tables;
    };

    // regenerating api files when table added/removed
    watchMap.dbxFiles[resolvePath(dbxConfig.base, "base.ts")] = async () => {
      await generateApiFiles(tables.flatMap(tableFlatMapper));

      // do not call generateAmbientVirtualModules here,
      // it is called by watchMap.apiFiles
    };

    for (const handlerMap of [
      // 000 keep the order!
      watchMap.tplFiles, // 001
      watchMap.dbxFiles, // 002
      watchMap.apiFiles, // 003
    ]) {
      for (const handler of Object.values(handlerMap)) {
        await handler();
      }
    }

    await filesGenerator.persistGeneratedFiles(base, (f) => {
      return join(sourceFolder, f);
    });
  }

  return {
    name: PLUGIN_NAME,

    resolveId(id) {
      if (avModules[id]) {
        return id;
      }
    },

    load(id) {
      if (avModules[id]) {
        return {
          code: avModules[id].virtualCode,
          map: null,
        };
      }
    },

    transform(src, id) {
      if (avModules[id]) {
        return transform(src, {
          loader: "ts",
        });
      }
    },

    configResolved,

    configureServer(server) {
      for (const handlerMap of Object.values(watchMap)) {
        server.watcher.add(Object.keys(handlerMap));
      }

      server.watcher.on("change", async (file) => {
        if (watchMap.tplFiles[file]) {
          await watchMap.tplFiles[file]();
          // regenerating everything when some template updated
          for (const handler of [
            ...Object.values(watchMap.dbxFiles),
            ...Object.values(watchMap.apiFiles),
          ]) {
            await handler();
          }
        } else {
          for (const map of [watchMap.dbxFiles, watchMap.apiFiles]) {
            if (map[file]) {
              await map[file]();
            }
          }
        }
      });
    },
  };
}
