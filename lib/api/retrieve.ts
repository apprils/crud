
import {
  type Middleware,
  get,
} from "@appril/core/router";

import type {
  Ctx, Context, GenericObject,
  DefaultHandler, CustomHandler,
} from "./@types";

export default function retrieveHandlerFactory<
  ItemT,
  QueryBuilder,
>(
  init: Middleware<any, any>,
) {

  type CrudContextExtend = {
    queryBuilder: QueryBuilder;
  }

  type CtxT = Ctx<
    ItemT,
    CrudContextExtend
  >

  type ReturnT = ItemT | undefined

  type CustomSetup = {
    queryBuilder?: (ctx: CtxT) => Promise<QueryBuilder>;
    assets?: (ctx: CtxT, item: ItemT) => Promise<GenericObject>;
  }

  const defaultHandler: DefaultHandler<CtxT, ReturnT> = async function(
    ctx: CtxT,
  ): Promise<ReturnT> {

    const { crud } = ctx

    return crud.queryBuilder
      // @ts-expect-error
      .where(crud.primaryKey, ctx.params._id)
      .find(crud.returningLiteral)

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
      Context<ItemT, CrudContextExtend>
    >(":_id", [

      init,

      async (ctx, next) => {

        ctx.crud.queryBuilder = await customSetup?.queryBuilder?.(ctx) || ctx.crud.dbi.clone()

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

  return handlerFactory

}

