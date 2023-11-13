
import type {
  ConnectionConfig, Config as PgtsConfig,
  TableDeclaration,
} from "@appril/pgts";

export type { ConnectionConfig, PgtsConfig, TableDeclaration }

export type Templates = {
  index?: string;
  base?: string;
  store?: string;
  handlers?: string;
  extra?: string;
  types?: string;
  Layout?: string;
  Pager?: string;
  ControlButtons?: string;
  CreateDialog?: string;
  EditorPlaceholder?: string;
}

export type Table = TableDeclaration & {
  apiName: string;
  apiBase: string;
}

export type Config = {
  schema?: string;
  outDir: string;
  apiDir?: string;
  importBase?: string;
  apiBase?: string;
  templates?: Templates;
  tableFilter?: (t: TableDeclaration) => boolean;
  meta?: Record<string, Record<string, any>> | ((t: Table) => Record<string, any>);
}

