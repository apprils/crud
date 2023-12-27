
import {
  type Middleware,
  get,
} from "@appril/core/router";

import type {
  Ctx, Context,
  GenericObject, DefaultHandler,
} from "./@types";

export default function envHandlerFactory<
  ItemT,
>(
  init: Middleware<any, any>,
) {

  type CtxT = Ctx<ItemT>

  return function handlerFactory<ReturnT extends GenericObject = {}>(
    handler: DefaultHandler<CtxT, ReturnT>,
  ) {

    return get<
      any,
      Context<ItemT>
    >("env", [
      init,
      async (ctx, next) => {
        ctx.body = await handler(ctx)
        return next()
      }
    ])

  }

}

