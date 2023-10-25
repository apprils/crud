
import type { Env, Next, RouteSpec } from "@appril/core/router";
import { get, post, patch, del } from "@appril/core/router";
import type { ZodSchema } from "zod";

import type {
  DatasetFromPayloadOption,
  GenericMiddleware, EnvMiddleware, ListMiddleware, RetrieveMiddleware,
  CreateMiddleware, UpdateMiddleware, DeleteMiddleware,
} from "./@types";

import { config } from "./config";
import { payloadInit, datasetFromPayload, validateDataset } from "./dataset";

import _env from "./env";
import _list from "./list";
import _retrieve from "./retrieve";
import _create from "./create";
import _update from "./update";
import _delete from "./delete";

type EnvSetup<StateT, ContextT> =
  | EnvMiddleware<StateT, ContextT>
  | EnvMiddleware<StateT, ContextT>[]
  | Partial<ReturnType<typeof _env<StateT, ContextT>>>

type ListSetup<QueryBuilderT, RecordT, StateT, ContextT> =
  | ListMiddleware<QueryBuilderT, RecordT, StateT, ContextT>
  | ListMiddleware<QueryBuilderT, RecordT, StateT, ContextT>[]
  | Partial<ReturnType<typeof _list<QueryBuilderT, RecordT, StateT, ContextT>> & {
      itemsPerPage: number,
      sidePages: number,
    }>

type RetrieveSetup<QueryBuilderT, RecordT, StateT, ContextT> =
  | RetrieveMiddleware<QueryBuilderT, RecordT, StateT, ContextT>
  | RetrieveMiddleware<QueryBuilderT, RecordT, StateT, ContextT>[]
  | Partial<ReturnType<typeof _retrieve<QueryBuilderT, RecordT, StateT, ContextT>>>

type CreateSetup<RecordT, StateT, ContextT> =
  | CreateMiddleware<RecordT, StateT, ContextT>
  | CreateMiddleware<RecordT, StateT, ContextT>[]
  | Partial<ReturnType<typeof _create<RecordT, StateT, ContextT>> & {
      datasetFromPayload: DatasetFromPayloadOption;
      zodSchema?: ZodSchema;
      zodErrorHandler?: Function;
    }>

type UpdateSetup<RecordT, StateT, ContextT> =
  | UpdateMiddleware<RecordT, StateT, ContextT>
  | UpdateMiddleware<RecordT, StateT, ContextT>[]
  | Partial<ReturnType<typeof _update<RecordT, StateT, ContextT>> & {
      datasetFromPayload: DatasetFromPayloadOption;
      zodSchema?: ZodSchema;
      zodErrorHandler?: Function;
    }>

type DeleteSetup<QueryBuilderT, RecordT, StateT, ContextT> =
  | DeleteMiddleware<QueryBuilderT, RecordT, StateT, ContextT>
  | DeleteMiddleware<QueryBuilderT, RecordT, StateT, ContextT>[]
  | Partial<ReturnType<typeof _delete<QueryBuilderT, RecordT, StateT, ContextT>>>

export type CrudSetup<
  QueryBuilderT = unknown,
  RecordT = unknown,
  StateT = unknown,
  ContextT = unknown,
> = {
  primaryKey: string;
  returningExclude: string[];
  env:      EnvSetup<StateT, ContextT>;
  list:     ListSetup<QueryBuilderT, RecordT, StateT, ContextT>;
  retrieve: RetrieveSetup<QueryBuilderT, RecordT, StateT, ContextT>;
  create:   CreateSetup<RecordT, StateT, ContextT>;
  update:   UpdateSetup<RecordT, StateT, ContextT>;
  delete:   DeleteSetup<QueryBuilderT, RecordT, StateT, ContextT>;
}

type Crudspecs = <
  QueryBuilderT = unknown,
  RecordT = unknown,
  StateT = unknown,
  ContextT = unknown,
>(
  dbi: ((env: Env) => any) | any,
  setup: Partial<CrudSetup<QueryBuilderT, RecordT, StateT, ContextT>>
) => RouteSpec[]

export { config }

export const crudspecs: Crudspecs = function(
  dbi: ((env: Env) => any) | any,
  {
    primaryKey = config.primaryKey,
    returningExclude = [],
    ...optedSetup
  } = {},
) {

  const stockMiddleware = {
    env:      _env(),
    list:     _list(),
    retrieve: _retrieve(),
    create:   _create(),
    update:   _update(),
    delete:   _delete(),
  }

  const _init: GenericMiddleware = function _init(env, next) {

    env.crud = {
      dbi,
      primaryKey,
      returningExclude: [ ...returningExclude ],
    }

    if (Object.prototype.toString.call(dbi) === "[object Function]") {
      env.crud.dbi = dbi(env)
    }

    return next()

  }

  function middlewareMapper(
    key: keyof typeof stockMiddleware,
  ) {

    let setup: any = optedSetup[key]

    if (Array.isArray(setup) || typeof setup === "function") {
      setup = { [key]: setup }
    }

    const middleware: any[] = []

    const mapper = function([ key, stock ]: [ string, typeof stockMiddleware ]) {
      return setup?.[key] || stock
    }

    // all keys are strings so it is safe to iterate over object.
    // insertion order kept as long as all keys are strings.
    for (const e of Object.entries(stockMiddleware[key]).map(mapper)) {
      Array.isArray(e)
        ? middleware.push(...e)
        : middleware.push(e)
    }

    return middleware.filter((e) => e)

  }

  return [

    get("env", [ _init, ...middlewareMapper("env") ]),

    get("list", [

      _init,

      function itemsPerPage({ crud }: any, next: Next) {

        crud.itemsPerPage = optedSetup.list && "itemsPerPage" in optedSetup.list
          ? optedSetup.list.itemsPerPage || config.itemsPerPage
          : config.itemsPerPage

        crud.sidePages = optedSetup.list && "sidePages" in optedSetup.list
          ? optedSetup.list.sidePages || config.sidePages
          : config.sidePages

        return next()

      },

      ...middlewareMapper("list")

    ]),

    get(":_id", [ _init, ...middlewareMapper("retrieve") ]),

    post([

      _init,
      payloadInit(),

      ...typeof optedSetup.create === "function" || Array.isArray(optedSetup.create)
        ? []
        : [
            datasetFromPayload(optedSetup.create?.datasetFromPayload),
            validateDataset({
              zodSchema: optedSetup.create?.zodSchema,
              zodErrorHandler: optedSetup.create?.zodErrorHandler,
            }),
          ],

      ...middlewareMapper("create")

    ]),

    patch(":_id", [

      _init,
      payloadInit(),

      ...typeof optedSetup.update === "function" || Array.isArray(optedSetup.update)
        ? []
        : [
            datasetFromPayload(optedSetup.update?.datasetFromPayload),
            validateDataset({
              zodSchema: optedSetup.update?.zodSchema,
              zodErrorHandler: optedSetup.update?.zodErrorHandler,
            }),
          ],

      ...middlewareMapper("update")

    ]),

    del(":_id", [ _init, ...middlewareMapper("delete") ]),

  ]

}

