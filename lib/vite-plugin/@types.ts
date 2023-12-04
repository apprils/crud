
import type {
  ConnectionConfig, Config as PgtsConfig,
  TableDeclaration,
} from "@appril/pgts";

export type { ConnectionConfig, PgtsConfig, TableDeclaration }

export type Templates = {
  api?: string;
  base?: string;
  ControlButtons?: string;
  CreateDialog?: string;
  EditorPlaceholder?: string;
  handlers?: string;
  index?: string;
  Layout?: string;
  Pager?: string;
  store?: string;
  types?: string;
  zod?: string;
}

export type Table = TableDeclaration & {
  basename: string;
  apiBase: string;
}

export type Config = {
  schema?: string;
  outDir: string;
  apiDir?: string;
  importBase?: string;
  templates?: Templates;
  alias?: Record<string, string | string[]>;
  tableFilter?: (t: TableDeclaration) => boolean;
  meta?: Record<string, Record<string, any>> | ((t: Table) => Record<string, any>);
}

