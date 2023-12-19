
import {
  type Middleware,
  del,
} from "@appril/core/router";

import type {
  Ctx, Context,
  DefaultHandler, CustomHandler,
} from "./@types";

export default function deleteHandlerFactory<
  ItemT,
>(
  init: Middleware<any, any>,
) {

  type CtxT = Ctx<ItemT>

  type ReturnT = ItemT | undefined

  const defaultHandler: DefaultHandler<CtxT, ReturnT> = async function(
    ctx: CtxT,
  ): Promise<ReturnT> {

    const { crud } = ctx

    const [ item ] = await crud.dbi
      .where(crud.primaryKey, ctx.params._id)
      .delete()
      .returning(crud.returningLiteral)

    return item

  }

  return function handlerFactory(
    customHandler?: CustomHandler<CtxT, ReturnT>,
  ) {

    return del<
      any,
      Context<ItemT>
    >(":_id", [

      init,

      async (ctx, next) => {

        ctx.body = customHandler
          ? await customHandler(ctx, { defaultHandler })
          : await defaultHandler(ctx)

        return next()

      }

    ])

  }

}

