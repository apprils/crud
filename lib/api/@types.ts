
import type { DefaultContext, Middleware } from "@appril/core/router";

export type Config = {
  primaryKey: string;
  itemsPerPage: number;
  sidePages: number;
}

export type Payload = Record<string, any>

export type Dataset = Record<string, any>

type Context<CrudContextT, ContextT> = {
  crud: {
    dbi: any;
    primaryKey: string;
    returningExclude: string[];
  } & CrudContextT;
} & DefaultContext & ContextT

export type GenericMiddleware<StateT = {}, ContextT = {}> = Middleware<
  StateT,
  Context<{}, ContextT>
>

export type DatasetFromPayloadOption =
  | boolean
  | ((payload: Payload) => Dataset)
  | { [key: string]: { nullify?: boolean, exclude?: boolean } | ((payload: Payload) => any) }

export type DatasetFromPayloadContext = {
  payload: Payload;
  dataset: any;
}

export type DatasetMiddleware<StateT, ContextT> = Middleware<
  StateT,
  Context<DatasetFromPayloadContext, ContextT>
>

type EnvContext = {}

export type EnvMiddleware<StateT, ContextT> = Middleware<
  StateT,
  Context<EnvContext, ContextT>
>

type ListContext<QueryBuilderT, RecordT> = {
  returning: string[];
  itemsPerPage: number;
  sidePages: number;
  query: QueryBuilderT;
  items: RecordT[];
  pager: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    nextPage: number;
    prevPage: number;
    offset: number;
  };
}

export type ListMiddleware<QueryBuilderT, RecordT, StateT, ContextT> = Middleware<
  StateT,
  Context<ListContext<QueryBuilderT, RecordT>, ContextT>
>

type RetrieveContext<QueryBuilderT, RecordT> = {
  query: QueryBuilderT;
  returning: string[];
  item: RecordT;
}

export type RetrieveMiddleware<QueryBuilderT, RecordT, StateT, ContextT> = Middleware<
  StateT,
  Context<RetrieveContext<QueryBuilderT, RecordT>, ContextT>
>

type CreateContext<RecordT> = {
  item: RecordT;
  returning: string[];
}

export type CreateMiddleware<RecordT, StateT, ContextT> = Middleware<
  StateT,
  Context<CreateContext<RecordT> & DatasetFromPayloadContext, ContextT>
>

type UpdateContext<RecordT> = {
  item: RecordT;
  returning: string[];
}

export type UpdateMiddleware<RecordT, StateT, ContextT> = Middleware<
  StateT,
  Context<UpdateContext<RecordT> & DatasetFromPayloadContext, ContextT>
>

type DeleteContext<QueryBuilderT, RecordT> = {
  query: QueryBuilderT;
  item: RecordT;
  returning: string[];
}

export type DeleteMiddleware<QueryBuilderT, RecordT, StateT, ContextT> = Middleware<
  StateT,
  Context<DeleteContext<QueryBuilderT, RecordT>, ContextT>
>

