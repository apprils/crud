
import {
  type Middleware,
  use,
} from "@appril/core/router";

import type {
  CrudContext, Context, Ctx,
  DefaultHandler,
} from "./@types";

export default function returningExcludeHandlerFactory<
  ItemT,
>(
  init: Middleware<any, any>,
) {

  type CtxT = Ctx<ItemT>

  type ReturnT = CrudContext<ItemT>["returningExclude"]

  return function handlerFactory(
    handler: DefaultHandler<CtxT, ReturnT>,
  ) {

    return use<
      any,
      Context<ItemT>
    >([
      init,
      async (ctx, next) => {
        ctx.crud.returningExclude = await handler(ctx)
        return next()
      }
    ])

  }

}

