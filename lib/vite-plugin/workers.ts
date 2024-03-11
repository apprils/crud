import { dirname, join, resolve } from "node:path";
import { readdir } from "node:fs/promises";

import fsx from "fs-extra";
import { stringify } from "yaml";

import type { ClientTemplates, Table } from "./@types";
import type { ApiTypesLiteral } from "../client/@types";
import { BANNER, render } from "./render";
import { fileGenerator } from "./base";
import { extractTypes } from "./ast";

import apiBaseTpl from "./templates/api/base.tpl";

const { generateFile } = fileGenerator();

const clientTemplates: ClientTemplates = {};

// all these values are static so it's safe to store them at initialization;
// tables and customTemplates instead are constantly updated
// so should be provided to workers on every call
let rootPath: string;
let cacheDir: string;
let apiDir: string;
let sourceFolder: string;
let base: string;
let dbxBase: string;

export async function bootstrap(data: {
  rootPath: string;
  cacheDir: string;
  apiDir: string;
  sourceFolder: string;
  base: string;
  dbxBase: string;
  tables: Table[];
  customTemplates: ClientTemplates;
}) {
  const { tables, customTemplates } = data;

  rootPath = data.rootPath;
  cacheDir = data.cacheDir;
  apiDir = data.apiDir;
  sourceFolder = data.sourceFolder;
  base = data.base;
  dbxBase = data.dbxBase;

  // should always go first
  await readClientTemplates();

  // next after templates
  await updateTsconfig();
  await generateFile(join(cacheDir, "env.d.ts"), "");

  for (const table of tables) {
    await generateClientModules({ table, customTemplates });
  }

  await generateApiIndexFiles({ tables });
}

export async function handleSchemaFileUpdate({
  tables,
  schema,
  customTemplates,
}: {
  tables: Table[];
  schema: string;
  customTemplates: ClientTemplates;
}) {
  // ensuring modules generated for newly added tables
  for (const table of tables.filter((e) => e.schema === schema)) {
    await generateClientModules({ table, customTemplates });
  }

  // ensuring newly added tables reflected in api index files
  await generateApiIndexFiles({ tables });
}

export async function handleApiFileUpdate({
  table,
  customTemplates,
}: {
  table: Table;
  customTemplates: ClientTemplates;
}) {
  // rebuilding client modules for table represented by updated api file
  await generateClientModules({ table, customTemplates });

  // only client modules updated here, api index files not affected
}

export async function handleCustomTemplateUpdate({
  tables,
  customTemplates,
}: {
  tables: Table[];
  customTemplates: ClientTemplates;
}) {
  // rebuilding client modules for all tables when some custom template updated
  for (const table of tables) {
    await generateClientModules({ table, customTemplates });
  }

  // customTemplates only relevant to client modules, api index files not affected
}

export async function generateApiIndexFiles(data: {
  tables: Table[];
}) {
  const tables = data.tables.sort((a, b) => a.name.localeCompare(b.name));

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
      template: resolve(__dirname, "templates/api/route.tpl"),
      meta: table.meta,
    };
  }

  // not creating route file directly,
  // rather adding a corresponding entry to yml file
  // and file will be created by api generator plugin
  await generateFile(
    join(apiDir, `_000_${base}_routes.yml`),
    [BANNER.trim().replace(/^/gm, "#"), stringify(routes)].join("\n"),
  );

  // generating a bundle file containing api constructors for all tables
  await generateFile(join(apiDir, base, "base.ts"), {
    template: apiBaseTpl,
    context: {
      BANNER,
      sourceFolder,
      dbxBase,
      tables,
    },
  });
}

export async function generateClientModules({
  table,
  customTemplates,
}: {
  table: Table;
  customTemplates: ClientTemplates;
}) {
  const apiTypes = extractTypes(
    await fsx.readFile(table.apiFileFullpath, "utf8"),
    {
      root: sourceFolder,
      base: dirname(table.apiFile),
    },
  );

  const tplNames = Object.keys(clientTemplates) as (keyof ClientTemplates)[];

  for (const tplName of tplNames) {
    const tplText = customTemplates[tplName] || clientTemplates[tplName] || "";

    // biome-ignore format:
    let content = [
      [/@crud:base-placeholder/, base],
    ].reduce(
      (prev, [regex, text]) => prev.replace(regex, text as string),
      tplText,
    );

    const context: Record<string, unknown> = {
      ...table,
      dbxBase,
      apiTypes,
    };

    if (["assets.ts", "apiTypes.ts"].includes(tplName)) {
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

      content = render(content, context);
    }

    await generateFile(join(cacheDir, table.basename, tplName), content);
  }
}

async function readClientTemplates() {
  const entries = await readdir(resolve(__dirname, "templates/client"), {
    withFileTypes: true,
  });

  for (const e of entries) {
    if (e.isFile()) {
      const name = e.name.replace(/\.tpl$/, "") as keyof ClientTemplates;
      clientTemplates[name] = await fsx.readFile(join(e.path, e.name), "utf8");
    }
  }
}

async function updateTsconfig() {
  const paths = {
    // join is inappropriate here, we need slashes in any environment
    [`${base}/*`]: `${cacheDir.replace(rootPath, "..")}/*`,
  };

  const tsconfigPath = join(rootPath, sourceFolder, "tsconfig.json");

  let tsconfig = JSON.parse(await fsx.readFile(tsconfigPath, "utf8"));

  let updateTsconfig = false;

  for (const [key, val] of Object.entries(paths)) {
    if (tsconfig.compilerOptions.paths?.[key]?.includes?.(val)) {
      continue;
    }

    tsconfig = {
      ...tsconfig,
      compilerOptions: {
        ...tsconfig.compilerOptions,
        paths: {
          ...tsconfig.compilerOptions.paths,
          [key]: [val],
        },
      },
    };

    updateTsconfig = true;
  }

  if (updateTsconfig) {
    await fsx.writeJson(tsconfigPath, tsconfig, {
      spaces: 2,
    });
  }
}
