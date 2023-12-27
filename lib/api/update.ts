
import type { ZodTypeAny } from "zod";

import {
  type Middleware,
  patch,
} from "@appril/core/router";

import type {
  Ctx, Context, Dataset,
  DefaultHandler, CustomHandler,
} from "./@types";

export default function updateHandlerFactory<
  ItemT,
>(
  init: Middleware<any, any>,
  opt: {
    zodSchema?: Record<string, ZodTypeAny>;
    zodErrorHandler?: Function;
  },
) {

  type CrudContextExtend = {
    dataset: Dataset;
    validatedDataset: Dataset;
    zodSchema?: Record<string, ZodTypeAny>;
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
    zodSchema?: (ctx: CtxT) => Promise<Record<string, ZodTypeAny>>;
    zodErrorHandler?: (ctx: CtxT) => Promise<Function>;
  }

  const defaultHandler: DefaultHandler<CtxT, ReturnT> = async function(
    ctx: CtxT,
  ): Promise<ReturnT> {

    const { crud } = ctx

    const [ item ] = await crud.dbi.clone()
      .where(crud.primaryKey, ctx.params._id)
      .update(crud.validatedDataset)
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

    return patch<
      any,
      Context<ItemT, CrudContextExtend>
    >(":_id", [

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

