
import type {
  ConnectionConfig, Config as PgtsConfig,
  TableDeclaration,
} from "@appril/pgts";

export type { ConnectionConfig, PgtsConfig, TableDeclaration }

export type Templates = {
  index?: string;
  setup?: string;
  Layout?: string;
  Pager?: string;
  ControlButtons?: string;
  EditorPlaceholder?: string;
  Notifications?: string;
  Overlay?: string;
  apiEntry?: string;
  apiIndex?: string;
}

export type Table = TableDeclaration & {
  apiName: string;
  apiBase: string;
}

export type Config = {
  outDir: string;
  apiDir?: string;
  importBase?: string;
  apiBase?: string;
  templates?: Templates;
  tableFilter?: (t: TableDeclaration) => boolean;
  meta?: Record<string, Record<string, any>> | ((t: Table) => Record<string, any>);
}

