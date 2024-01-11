
import type { Knex } from "knex";
import type { Instance, QueryBuilder } from "@appril/dbx"

import {
  type DefaultState,
  type DefaultContext,
  type Ctx,
  use as $use,
  get as $get,
  post as $post,
  patch as $patch,
  del as $del,
} from "@appril/core/router";

import {
  type Config,
  config
} from "@appril/crud/api";

import { type Pager } from "@appril/crud/client";

import { type ZodTypeAny, z } from "zod";

type Dataset = Record<string, any>

type GenericObject = Record<string, any>

type MaybePromise<T> = Promise<T> | T

type DefaultHandler<CtxT, ReturnT> = (ctx: CtxT) => MaybePromise<ReturnT>;

type CustomHandler<CtxT, ReturnT> = (
  ctx: CtxT,
  opt: { defaultHandler: DefaultHandler<CtxT, ReturnT> },
) => MaybePromise<ReturnT>;

export function $crudHandlersFactory<
  TableName extends Knex.TableNames,
  ItemT,
  ItemI,
  ItemU,
  PKeyT = unknown
>(
  dbi: Instance<TableName>,
  opt: {
    primaryKey: keyof ItemT;
    columns: (keyof ItemT)[],
    itemsPerPage?: number;
    sidePages?: number;
    zodSchema?: Record<string, ZodTypeAny>;
    zodErrorHandler?: Function;
  },
) {

  type CrudContext<Extend = unknown> = {
    readonly dbi: QueryBuilder<TableName>;
    readonly primaryKey: keyof ItemT;
    readonly columns: (keyof ItemT)[];
    returning?: (keyof ItemT)[];
    returningExclude?: (keyof ItemT)[];
    returningLiteral: (keyof ItemT)[] | "*";
  } & Extend

  type Context<Extend = unknown> = DefaultContext & {
    readonly crud: CrudContext<Extend>;
  }

  const {
    primaryKey,
    columns,
    itemsPerPage,
    sidePages,
    zodSchema,
    zodErrorHandler,
  } = { ...config as Config<ItemT>, ...opt }

  const returningLiteral = function(
    this: CrudContext
  ) {

    if (this.returning) {
      return [
        primaryKey,
        ...this.returning.filter((e) => e !== primaryKey)
      ]
    }

    if (this.returningExclude) {
      return [
        primaryKey,
        ...columns.filter((e) => e !== primaryKey && !this.returningExclude?.includes(e))
      ]
    }

    return "*"

  }

  const validatedDataset = function(
    this: CrudContext<{
      dataset: Dataset;
      zodSchema: Record<string, ZodTypeAny>;
      zodErrorHandler: Function;
    }>
  ) {

    if (!this.dataset) {
      return
    }

    if (!this.zodSchema) {
      return this.dataset
    }

    const zodObject = z.object(
      Object.keys(this.dataset).reduce((acc, col) => ({
        ...acc,
        [col]: this.zodSchema[col],
      }), {})
    )

    try {
      zodObject.parse(this.dataset)
    }
    catch(error: any) {
      throw this.zodErrorHandler?.(error) || error
    }

    return this.dataset

  }

  const ctxExtend: {
    crud: CrudContext,
  } = {
    crud: Object.defineProperties({} as CrudContext, {
      dbi: { get() { return dbi }, configurable: false },
      columns: { get() { return [ ...opt.columns ] }, configurable: false },
      primaryKey: { get() { return primaryKey }, configurable: false },
      returningLiteral: { get: returningLiteral, configurable: false },
      validatedDataset: { get: validatedDataset, configurable: false },
    }),
  }

  function initHandler(
    ctx: any,
    next: any,
  ) {

    for (const [ key, value ] of Object.entries(ctxExtend)) {
      key in ctx || Object.defineProperty(ctx, key, {
        value,
        configurable: false,
        writable: false,
        enumerable: true,
      })
    }

    return next()

  }

  function envHandlerFactory() {

    function envHandler<ReturnT extends GenericObject = {}>(
      handler: DefaultHandler<
        Ctx<DefaultState, Context>,
        ReturnT
      >,
    ) {

      return $get<
        any,
        Context
      >("env", [
        initHandler,
        async (ctx, next) => {
          ctx.body = await handler(ctx)
          return next()
        }
      ])

    }

    return envHandler

  }

  function returningHandlerFactory() {

    function returningHandler(
      handler: DefaultHandler<
        Ctx<DefaultState, Context>,
        CrudContext["returning"]
      >,
    ) {

      return $use<
        any,
        Context
      >([
        initHandler,
        async (ctx, next) => {
          ctx.crud.returning = await handler(ctx)
          return next()
        }
      ])

    }

    return returningHandler

  }

  function returningExcludeHandlerFactory() {

    function returningExcludeHandler(
      handler: DefaultHandler<
        Ctx<DefaultState, Context>,
        CrudContext["returningExclude"]
      >,
    ) {

      return $use<
        any,
        Context
      >([
        initHandler,
        async (ctx, next) => {
          ctx.crud.returningExclude = await handler(ctx)
          return next()
        }
      ])

    }

    return returningExcludeHandler

  }

  function createHandlerFactory() {

    type ContextT = Context<{
      dataset: Dataset;
      validatedDataset: Dataset;
      zodSchema?: Record<string, ZodTypeAny>;
      zodErrorHandler?: Function;
    }>

    type CtxT = Ctx<
      DefaultState,
      ContextT
    >

    type ReturnT = ItemT | undefined

    type CustomSetup = {
      dataset?: (ctx: CtxT) => MaybePromise<ItemI>;
      datasetExtend?: (ctx: CtxT) => MaybePromise<Partial<ItemI> | undefined>;
      zodSchema?: (ctx: CtxT) => MaybePromise<Record<string, ZodTypeAny>>;
      zodErrorHandler?: (ctx: CtxT) => MaybePromise<Function>;
    }

    const defaultHandler: DefaultHandler<CtxT, ReturnT> = async function(
      ctx: CtxT,
    ): Promise<ReturnT> {

      const { crud } = ctx

      const [ item ] = await crud.dbi
        .insert(crud.validatedDataset as any)
        .returning(crud.returningLiteral as [])

      return item as ReturnT

    }

    function createHandler(
      customSetup: CustomSetup, 
    ): unknown

    function createHandler(
      customHandler?: CustomHandler<CtxT, ReturnT>,
    ): unknown

    function createHandler(
      arg: unknown,
    ) {

      let customSetup: CustomSetup
      let customHandler: CustomHandler<CtxT, ReturnT>

      if (typeof arg === "function") {
        customHandler = arg as typeof customHandler
      }
      else {
        customSetup = arg as typeof customSetup
      }

      return $post<
        DefaultState,
        ContextT
      >([

        initHandler,

        async (ctx, next) => {

          ctx.crud.dataset = {
            ...await customSetup?.dataset?.(ctx) || ctx.request.body as Dataset,
            ...await customSetup?.datasetExtend?.(ctx),
          }

          ctx.crud.zodSchema = await customSetup?.zodSchema?.(ctx) || zodSchema
          ctx.crud.zodErrorHandler = await customSetup?.zodErrorHandler?.(ctx) || zodErrorHandler

          ctx.body = customHandler
            ? await customHandler(ctx, { defaultHandler })
            : await defaultHandler(ctx)

          return next()

        }

      ])

    }

    return createHandler

  }

  function updateHandlerFactory() {

    type ContextT = Context<{
      _id: PKeyT;
      dataset: Dataset;
      validatedDataset: Dataset;
      zodSchema?: Record<string, ZodTypeAny>;
      zodErrorHandler?: Function;
    }>

    type CtxT = Ctx<
      DefaultState,
      ContextT
    >

    type ReturnT = ItemT | undefined

    type CustomSetup = {
      dataset?: (ctx: CtxT) => MaybePromise<ItemU>;
      datasetExtend?: (ctx: CtxT) => MaybePromise<Partial<ItemU> | undefined>;
      zodSchema?: (ctx: CtxT) => MaybePromise<Record<string, ZodTypeAny>>;
      zodErrorHandler?: (ctx: CtxT) => MaybePromise<Function>;
    }

    const defaultHandler: DefaultHandler<CtxT, ReturnT> = async function(
      ctx: CtxT,
    ): Promise<ReturnT> {

      const { crud } = ctx

      const [ item ] = await crud.dbi
        .where(
          crud.primaryKey as string,
          ctx.params._id
        )
        .update(crud.validatedDataset as any)
        .returning(crud.returningLiteral as [])

      return item as ReturnT

    }

    function updateHandler(
      customSetup: CustomSetup, 
    ): unknown

    function updateHandler(
      customHandler?: CustomHandler<CtxT, ReturnT>,
    ): unknown

    function updateHandler(
      arg: unknown,
    ) {

      let customSetup: CustomSetup
      let customHandler: CustomHandler<CtxT, ReturnT>

      if (typeof arg === "function") {
        customHandler = arg as typeof customHandler
      }
      else {
        customSetup = arg as typeof customSetup
      }

      return $patch<
        DefaultState,
        ContextT
      >(":_id", [

        initHandler,

        (ctx, next) => {
          ctx.crud._id = ctx.params._id as PKeyT
          return next()
        },

        async (ctx, next) => {

          ctx.crud.dataset = {
            ...await customSetup?.dataset?.(ctx) || ctx.request.body as Dataset,
            ...await customSetup?.datasetExtend?.(ctx),
          }

          ctx.crud.zodSchema = await customSetup?.zodSchema?.(ctx) || opt.zodSchema
          ctx.crud.zodErrorHandler = await customSetup?.zodErrorHandler?.(ctx) || opt.zodErrorHandler

          ctx.body = customHandler
            ? await customHandler(ctx, { defaultHandler })
            : await defaultHandler(ctx)

          return next()

        }

      ])

    }

    return updateHandler

  }

  function deleteHandlerFactory() {

    type ContextT = Context<{
      _id: PKeyT;
    }>

    type CtxT = Ctx<
      DefaultState,  
      ContextT
    >

    type ReturnT = ItemT | undefined

    const defaultHandler: DefaultHandler<CtxT, ReturnT> = async function(
      ctx: CtxT,
    ): Promise<ReturnT> {

      const { crud } = ctx

      const [ item ] = await crud.dbi
        .where(
          crud.primaryKey as string,
          ctx.params._id
        )
        .delete()
        .returning(crud.returningLiteral as [])

      return item as ReturnT

    }

    function deleteHandler(
      customHandler?: CustomHandler<CtxT, ReturnT>,
    ) {

      return $del<
        DefaultState,
        ContextT
      >(":_id", [

        initHandler,

        (ctx, next) => {
          ctx.crud._id = ctx.params._id as PKeyT
          return next()
        },

        async (ctx, next) => {

          ctx.body = customHandler
            ? await customHandler(ctx, { defaultHandler })
            : await defaultHandler(ctx)

          return next()

        }

      ])

    }

    return deleteHandler

  }

  function listHandlerFactory() {

    type ContextT = Context<{
      queryBuilder: QueryBuilder<TableName>;
      itemsPerPage: number;
      sidePages: number;
    }>

    type CtxT = Ctx<
      DefaultState,
      ContextT
    >

    type ReturnT = {
      items: ItemT[];
      pager: Pager;
    }

    type CustomSetup = {
      // used for filters, sorting etc.
      queryHandler?: (ctx: CtxT, query: QueryBuilder<TableName>) => MaybePromise<void>;
      itemsPerPage?: (ctx: CtxT) => MaybePromise<number>;
      sidePages?: (ctx: CtxT) => MaybePromise<number>;
    }

    const defaultHandler: DefaultHandler<CtxT, ReturnT> = async function(
      ctx: CtxT,
    ): Promise<ReturnT> {

      const { crud } = ctx

      const totalItems = await crud.queryBuilder.clone().countRows()
      const totalPages = Math.ceil(totalItems / crud.itemsPerPage)

      let currentPage = Number(ctx.query._page || 0)

      if (currentPage < 1) {
        currentPage = 1
      }

      if (currentPage > totalPages) {
        currentPage = totalPages
      }

      let nextPage = currentPage + 1

      if (nextPage > totalPages) {
        nextPage = 0
      }

      let prevPage = currentPage - 1

      if (prevPage < 1) {
        prevPage = 0
      }

      let minPage = currentPage - crud.sidePages

      if ((currentPage + crud.sidePages) > totalPages) {
        minPage = totalPages - (crud.sidePages * 2)
      }

      if (minPage < 1) {
        minPage = 1
      }

      let maxPage = currentPage + crud.sidePages

      if (currentPage < crud.sidePages) {
        maxPage = crud.sidePages * 2
      }

      if (maxPage > totalPages) {
        maxPage = totalPages
      }

      let offset = (currentPage - 1) * crud.itemsPerPage

      if (offset < 0) {
        offset = 0
      }

      const pager = {
        totalItems,
        totalPages,
        currentPage,
        nextPage,
        prevPage,
        offset,
      }

      const items = (
        await crud.queryBuilder
          .select(crud.returningLiteral)
          .offset(offset)
          .limit(crud.itemsPerPage)
      ) as ItemT[]

      return {
        items,
        pager,
      }

    }

    function listHandler(
      customSetup: CustomSetup, 
    ): unknown

    function listHandler(
      customHandler?: CustomHandler<CtxT, ReturnT>,
    ): unknown

    function listHandler(
      arg: unknown,
    ) {

      let customSetup: CustomSetup
      let customHandler: CustomHandler<CtxT, ReturnT>

      if (typeof arg === "function") {
        customHandler = arg as typeof customHandler
      }
      else {
        customSetup = arg as typeof customSetup
      }

      return $get<
        DefaultState,
        ContextT
      >("list", [

        initHandler,

        async (ctx, next) => {

          ctx.crud.queryBuilder = ctx.crud.dbi.clone()

          await customSetup?.queryHandler?.(ctx, ctx.crud.queryBuilder)

          ctx.crud.itemsPerPage = await customSetup?.itemsPerPage?.(ctx) || itemsPerPage
          ctx.crud.sidePages = await customSetup?.sidePages?.(ctx) || sidePages

          ctx.body = customHandler
            ? await customHandler(ctx, { defaultHandler })
            : await defaultHandler(ctx)

          return next()

        }

      ])

    }

    return listHandler

  }

  function retrieveHandlerFactory() {

    type ContextT = Context<{
      _id: PKeyT;
      queryBuilder: QueryBuilder<TableName>;
    }>

    type CtxT = Ctx<
      DefaultState,
      ContextT
    >

    type ReturnT = ItemT | undefined

    type CustomSetup = {
      // used for filters, sorting etc.
      queryHandler?: (ctx: CtxT, query: QueryBuilder<TableName>) => MaybePromise<void>;
      assets?: (ctx: CtxT, item: ItemT) => MaybePromise<GenericObject>;
    }

    const defaultHandler: DefaultHandler<CtxT, ReturnT> = async function(
      ctx: CtxT,
    ): Promise<ReturnT> {

      const { crud } = ctx

      const item = await crud.queryBuilder
        .where(
          crud.primaryKey as string,
          ctx.params._id
        )
        .find(crud.returningLiteral as [])

      return item as ReturnT

    }

    function retrieveHandler(
      customSetup: CustomSetup, 
    ): unknown

    function retrieveHandler(
      customHandler?: CustomHandler<CtxT, ReturnT>,
    ): unknown

    function retrieveHandler(
      arg: unknown,
    ) {

      let customSetup: CustomSetup
      let customHandler: CustomHandler<CtxT, ReturnT>

      if (typeof arg === "function") {
        customHandler = arg as typeof customHandler
      }
      else {
        customSetup = arg as typeof customSetup
      }

      return $get<
        DefaultState,
        ContextT
      >(":_id", [

        initHandler,

        (ctx, next) => {
          ctx.crud._id = ctx.params._id as PKeyT
          return next()
        },

        async (ctx, next) => {

          ctx.crud.queryBuilder = ctx.crud.dbi.clone()

          await customSetup?.queryHandler?.(ctx, ctx.crud.queryBuilder)

          const item = customHandler
            ? await customHandler(ctx, { defaultHandler })
            : await defaultHandler(ctx)

          if (!item) {
            return
          }

          ctx.body = {
            item,
            assets: await customSetup?.assets?.(ctx, item)
          }

          return next()

        }

      ])

    }

    return retrieveHandler

  }

  return {
    env: envHandlerFactory(),
    returning: returningHandlerFactory(),
    returningExclude: returningExcludeHandlerFactory(),
    create: createHandlerFactory(),
    update: updateHandlerFactory(),
    delete: deleteHandlerFactory(),
    list: listHandlerFactory(),
    retrieve: retrieveHandlerFactory(),
  }

}

