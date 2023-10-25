
import type { ZodSchema } from "zod";

import type {
  DatasetFromPayloadOption, DatasetMiddleware,
  Payload,
} from "./@types";

export function payloadInit<
  StateT,
  ContextT,
>(): DatasetMiddleware<StateT, ContextT> {
  return function _payloadInit(env, next) {
    env.crud.payload = <Payload>env.request.body
    return next()
  }
}

export function datasetFromPayload<
  StateT,
  ContextT,
>(
  datasetFromPayload: DatasetFromPayloadOption | undefined,
): DatasetMiddleware<StateT, ContextT> {

  if (typeof datasetFromPayload === "function") {
    return async function _datasetFromPayload(env, next) {
      env.crud.dataset = await datasetFromPayload({ ...env.crud.payload })
      return next()
    }
  }

  if (typeof datasetFromPayload === "object") {

    return async function _datasetFromPayload(env, next) {

      const { crud } = env

      crud.dataset = { ...crud.payload }

      for (const [ key, val ] of Object.entries(datasetFromPayload)) {

        if (typeof val === "function") {
          crud.dataset[key] = await val({ ...crud.payload })
        }
        else if (typeof val === "object") {

          if (val.exclude) {
            delete crud.dataset[key]
          }

          if (val.nullify && key in crud.dataset && crud.dataset[key] === "") {
            crud.dataset[key] = null
          }

        }

      }

      return next()

    }

  }

  return function _datasetFromPayload(env, next) {
    env.crud.dataset = { ...env.crud.payload }
    return next()
  }

}

export function validateDataset<
  StateT,
  ContextT,
>({
  zodSchema,
  zodErrorHandler,
}: {
  zodSchema?: ZodSchema;
  zodErrorHandler?: Function;
}): DatasetMiddleware<StateT, ContextT> {

  return function _validateDataset(env, next) {

    if (zodSchema) {
      try {
        zodSchema.parse(env.crud.payload)
      }
      catch(error: any) {
        env.throw(zodErrorHandler?.(error) || error)
      }
    }

    return next()

  }

}

