import { join, basename } from "path";
import { readFile } from "fs/promises";

import type { Plugin, ResolvedConfig } from "vite";

import type { Options, ClientTemplates, Table, DbxConfig } from "./@types";

import { resolvePath } from "./base";
import { workerPool } from "./worker-pool";
import { bootstrap } from "./workers";
import { extractTables } from "./tables";

const PLUGIN_NAME = "@appril:crudPlugin";

export async function crudPlugin(
  dbxConfig: DbxConfig,
  options: Options,
): Promise<Plugin> {
  const { base, schemas = ["public"], apiDir = "api", usePolling } = options;

  const tableMap: Record<string, Table> = {};

  const tplWatchers: Record<string, () => Promise<void>> = {};
  const schemaWatchers: Record<string, () => Promise<string>> = {};

  const sourceFolder = basename(resolvePath());

  const customTemplates: ClientTemplates = {};

  const runWatchHandler = async (file: string) => {
    if (schemaWatchers[file]) {
      // updating tableMap
      const schema = await schemaWatchers[file]();

      // then feeding it to worker
      await workerPool.base.handleSchemaFileUpdate({
        schema,
        tables: Object.values(tableMap),
        customTemplates,
      });

      return;
    }

    if (tplWatchers[file]) {
      // updating customTemplates
      await tplWatchers[file]();

      // then feeding it to worker
      await workerPool.base.handleCustomTemplateUpdate({
        tables: Object.values(tableMap),
        customTemplates,
      });

      return;
    }

    for (const table of Object.values(tableMap)) {
      if (table.apiFileFullpath === file) {
        await workerPool.base.handleApiFileUpdate({ table, customTemplates });
        return;
      }
    }
  };

  return {
    name: PLUGIN_NAME,

    async configResolved(config: ResolvedConfig) {
      const cacheDir = join(config.cacheDir, base);

      // watching custom templates for updates
      for (const [name, file] of Object.entries({ ...options.templates }) as [
        name: keyof ClientTemplates,
        file: string,
      ][]) {
        tplWatchers[resolvePath(file)] = async () => {
          customTemplates[name] = await readFile(resolvePath(file), "utf8");
        };
      }

      // watching schemas for added/removed tables
      for (const schema of schemas) {
        const file = resolvePath(dbxConfig.base, join(schema, "index.ts"));

        schemaWatchers[file] = async () => {
          const tables = await extractTables({
            options,
            config,
            dbxConfig,
            schema,
          });

          for (const table of tables) {
            tableMap[table.basename] = table;
          }

          return schema;
        };
      }

      // populating customTemplates for bootstrap
      for (const handler of Object.values(tplWatchers)) {
        await handler();
      }

      // pupulating tableMap for bootstrap
      for (const handler of Object.values(schemaWatchers)) {
        await handler();
      }

      const payload = {
        rootPath: resolvePath(".."),
        cacheDir,
        apiDir,
        sourceFolder,
        base,
        dbxBase: dbxConfig.base,
        tables: Object.values(tableMap),
        customTemplates,
      };

      config.command === "build"
        ? await bootstrap(payload)
        : await workerPool.base.bootstrap(payload);
    },

    configureServer({ watcher }) {
      watcher.options = {
        ...watcher.options,
        disableGlobbing: false,
        usePolling,
      };

      // watching custom templates;
      // regenerate all tables modules on change
      watcher.add(Object.keys(tplWatchers));

      // watching schema files for added/removed tables;
      // extract tables and rebuild schema tables modules on change
      watcher.add(Object.keys(schemaWatchers));

      // watching api files;
      // regenerate table modules on change
      watcher.add(`${resolvePath(apiDir)}/**/*.ts`);

      watcher.on("change", runWatchHandler);
    },
  };
}
