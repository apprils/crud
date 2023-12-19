
import {
  type Middleware,
  get,
} from "@appril/core/router";

import type { Pager } from "../client/@types";

import type {
  Ctx, Context,
  CustomHandler, DefaultHandler,
} from "./@types";

export default function listHandlerFactory<
  ItemT,
  QueryBuilder,
>(
  init: Middleware<any, any>,
  opt: {
    itemsPerPage: number;
    sidePages: number;
  },
) {

  type CrudContextExtend = {
    queryBuilder: QueryBuilder;
    itemsPerPage: number;
    sidePages: number;
  }

  type CtxT = Ctx<
    ItemT,
    CrudContextExtend
  >

  type ReturnT = {
    items: ItemT[];
    pager: Pager;
  }

  type CustomSetup = {
    queryBuilder?: (ctx: CtxT) => Promise<QueryBuilder>;
    filter?: (ctx: CtxT, queryBuilder: QueryBuilder) => Promise<void>;
    orderBy?: (ctx: CtxT) => Promise<(string | Record<string, "asc" | "desc">)[]>;
    itemsPerPage?: (ctx: CtxT) => Promise<number>;
    sidePages?: (ctx: CtxT) => Promise<number>;
  }

  const defaultHandler: DefaultHandler<CtxT, ReturnT> = async function(
    ctx: CtxT,
  ): Promise<ReturnT> {

    const { crud } = ctx

    // @ts-expect-error
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

    const items = await crud.queryBuilder
      // @ts-expect-error
      .select(
        crud.returningLiteral
      )
      .offset(offset)
      .limit(crud.itemsPerPage)

    return {
      items,
      pager,
    }

  }

  function handlerFactory(
    customSetup: CustomSetup, 
  ): unknown

  function handlerFactory(
    customHandler?: CustomHandler<CtxT, ReturnT>,
  ): unknown

  function handlerFactory(
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

    return get<
      any,
      Context<ItemT,CrudContextExtend>
    >("list", [

      init,

      async (ctx, next) => {

        ctx.crud.queryBuilder = await customSetup?.queryBuilder?.(ctx) || ctx.crud.dbi.clone()

        await customSetup?.filter?.(ctx, ctx.crud.queryBuilder)

        for (const entry of await customSetup?.orderBy?.(ctx) || [ { [ctx.crud.primaryKey]: "desc" } ]) {
          if (typeof entry === "string") {
            // @ts-expect-error
            ctx.crud.queryBuilder.orderBy(entry)
          }
          else {
            for (const [ col, ord ] of Object.entries(entry)) {
              // @ts-expect-error
              ctx.crud.queryBuilder.orderBy(col, ord)
            }
          }
        }

        ctx.crud.itemsPerPage = await customSetup?.itemsPerPage?.(ctx) || opt.itemsPerPage
        ctx.crud.sidePages = await customSetup?.sidePages?.(ctx) || opt.sidePages

        ctx.body = customHandler
          ? await customHandler(ctx, { defaultHandler })
          : await defaultHandler(ctx)

        return next()

      }

    ])

  }

  return handlerFactory

}

