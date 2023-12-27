
import type {
  ConnectionConfig, Config as PgtsConfig,
  TableDeclaration,
} from "@appril/pgts";

export type { ConnectionConfig, PgtsConfig, TableDeclaration }

export type Templates = {

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

}

export type AmbientVirtualTsModuleName =
  | "assets"
  | "apiTypes"
  | "api"
  | "base"
  | "handlers"
  | "setup"
  | "store"
  | "" // index

export type AmbientVirtualVueModuleName =

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
  | "Pager.vue.d.ts"

export type AmbientVirtualModuleName = 
  | AmbientVirtualTsModuleName
  | AmbientVirtualVueModuleName

export type AmbientVirtualModule = {
  id: string;
  name: AmbientVirtualModuleName;
  ambientCode: string;
  virtualCode: string;
}

export type AmbientVirtualModuleMap = Record<string, AmbientVirtualModule>

export type Table = TableDeclaration & {
  basename: string;
  // relative path inside apiDir, e.g. crud/products/
  apiPath: string;
  // fetch URL, e.g. /admin/api/crud/products
  apiBase: string;
  // relative path to file inside sourceFolder, e.g. api/crud/products/index.ts
  apiFile: string;
}

export type Config = {
  schema?: string;
  base: string;
  apiDir?: string;
  templates?: Templates;
  alias?: Record<string, string | string[]>;
  tableFilter?: (t: TableDeclaration) => boolean;
  meta?: Record<string, Record<string, any>> | ((t: Table) => Record<string, any>);
}

