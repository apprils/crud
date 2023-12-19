
import {
  type Middleware,
  post,
} from "@appril/core/router";

import type {
  Ctx, Context,
  DefaultHandler, CustomHandler,
  Dataset, ZodSchemaWrapper,
} from "./@types";

export default function createHandlerFactory<
  ItemT,
>(
  init: Middleware<any, any>,
  opt: {
    zodSchema?: ZodSchemaWrapper;
    zodErrorHandler?: Function;
  },
) {

  type CrudContextExtend = {
    dataset: Dataset;
    validatedDataset: Dataset;
    zodSchema?: ZodSchemaWrapper;
    zodErrorHandler?: Function;
  }

  type CtxT = Ctx<
    ItemT,
    CrudContextExtend
  >

  type ReturnT = ItemT | undefined

  type CustomSetup = {
    dataset?: (ctx: CtxT) => Promise<Dataset>;
    datasetExtend?: (ctx: CtxT) => Promise<Dataset>;
    zodSchema?: (ctx: CtxT) => Promise<ZodSchemaWrapper>;
    zodErrorHandler?: (ctx: CtxT) => Promise<Function>;
  }

  const defaultHandler: DefaultHandler<CtxT, ReturnT> = async function(
    ctx: CtxT,
  ): Promise<ReturnT> {

    const { crud } = ctx

    const [ item ] = await crud.dbi
      .insert(crud.validatedDataset)
      .returning(crud.returningLiteral)

    return item

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

    return post<
      any,
      Context<ItemT, CrudContextExtend>
    >([

      init,

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

  return handlerFactory

}

