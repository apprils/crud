
import type {
  ConnectionConfig, Config as PgtsConfig,
  TableDeclaration,
} from "@appril/pgts";

export type { ConnectionConfig, PgtsConfig, TableDeclaration }

export type Templates = {
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

export type ApiTemplates = {
  index?: string;
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
  apiBase?: string;
  templates?: Templates;
  apiTemplates?: ApiTemplates;
  alias?: Record<string, string | string[]>;
  tableFilter?: (t: TableDeclaration) => boolean;
  meta?: Record<string, Record<string, any>> | ((t: Table) => Record<string, any>);
}

