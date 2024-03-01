import type {
  ConnectionConfig,
  Config as PgtsConfig,
  TableDeclaration,
} from "@appril/pgts";

export type { ConnectionConfig, PgtsConfig, TableDeclaration };

export type ClientModuleTemplates = {
  "assets.ts"?: string;
  "apiTypes.ts"?: string;

  "api.ts"?: string;
  "base.ts"?: string;

  "ControlButtons.vue"?: string;
  "ControlButtons.vue.d.ts"?: string;

  "CreateDialog.vue"?: string;
  "CreateDialog.vue.d.ts"?: string;

  "EditorPlaceholder.vue"?: string;
  "EditorPlaceholder.vue.d.ts"?: string;

  "handlers.ts"?: string;
  "index.ts"?: string;

  "Layout.vue"?: string;
  "Layout.vue.d.ts"?: string;

  "Overlay.vue"?: string;
  "Overlay.vue.d.ts"?: string;

  "Pager.vue"?: string;
  "Pager.vue.d.ts"?: string;

  "setup.ts"?: string;
  "store.ts"?: string;
};

export type AVFactoryModuleName =
  | "@appril/crud:storeFactory"
  | "@appril/crud:handlersFactory";

export type AVTsModuleName =
  | "assets"
  | "apiTypes"
  | "api"
  | "base"
  | "handlers"
  | "setup"
  | "store"
  | ""; // index

export type AVVueModuleName =
  | "ControlButtons.vue"
  | "ControlButtons.vue.d.ts"
  | "CreateDialog.vue"
  | "CreateDialog.vue.d.ts"
  | "EditorPlaceholder.vue"
  | "EditorPlaceholder.vue.d.ts"
  | "Layout.vue"
  | "Layout.vue.d.ts"
  | "Overlay.vue"
  | "Overlay.vue.d.ts"
  | "Pager.vue"
  | "Pager.vue.d.ts";

export type AVModuleName =
  | AVFactoryModuleName
  | AVTsModuleName
  | AVVueModuleName;

export type AVModule = {
  id: string;
  name: AVModuleName;
  ambientCode: string;
  virtualCode: string;
};

export type AVModuleMap = Record<string, AVModule>;

export type Table = TableDeclaration & {
  basename: string;
  // relative path inside apiDir, e.g. crud/products/
  apiPath: string;
  // fetch URL, e.g. /admin/api/crud/products
  apiBase: string;
  // relative path to file inside sourceFolder, e.g. api/crud/products/index.ts
  apiFile: string;
};

export type Config = {
  base: string;
  apiDir?: string;
  schemas?: string[];
  templates?: ClientModuleTemplates;
  alias?: Record<string, string | string[]>;
  tableFilter?: (t: TableDeclaration) => boolean;
  meta?:
    | Record<string, Record<string, unknown>>
    | ((t: Table) => Record<string, unknown>);
};
