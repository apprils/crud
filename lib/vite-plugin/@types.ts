import type { TableDeclaration } from "@appril/pgts";

export type DbxConfig = import("@appril/pgts").Config & {
  connection: string | import("@appril/pgts").ConnectionConfig;
  base: string;
};

export type { TableDeclaration };

export type ClientTemplates = {
  "api.ts"?: string;
  "apiTypes.ts"?: string;
  "assets.ts"?: string;

  "ControlButtons.vue"?: string;
  "CreateDialog.vue"?: string;
  "EditorPlaceholder.vue"?: string;

  "handlers.ts"?: string;
  "index.ts"?: string;

  "Layout.vue"?: string;
  "Overlay.vue"?: string;
  "Pager.vue"?: string;

  "setup.ts"?: string;
  "store.ts"?: string;
};

export type TableAssets = {
  // tabme name for tables or alias name for aliases
  basename: string;
  // relative path inside apiDir, e.g. crud/products/
  apiPath: string;
  // fetch URL, e.g. /admin/api/crud/products
  apiBase: string;
  // relative path to file inside sourceFolder, e.g. api/crud/products/index.ts
  apiFile: string;
  apiFileFullpath: string;
  meta: Record<string, unknown>;
};

export type Table = TableDeclaration & TableAssets;

export type Options = {
  base: string;
  apiDir?: string;
  /**
    allowing multiple schemas. default: [ public ]
    same name tables would render inconsistently,
    so consider serve schemas separately, each with own base.
    eg. products table contained in both public and store schemas:
    plugins: [
      crudPlugin({ base: "crud", schemas: [ "public" ] }),
      crudPlugin({ base: "crudStore", schemas: [ "store" ] }),
    ] */
  schemas?: string[];
  templates?: ClientTemplates;
  alias?: Record<string, string | string[]>;
  tableFilter?: (t: TableDeclaration) => boolean;
  usePolling?: boolean;
  meta?:
    | Record<string, Record<string, unknown>>
    | ((t: Omit<Table, "meta">) => Record<string, unknown>);
};
