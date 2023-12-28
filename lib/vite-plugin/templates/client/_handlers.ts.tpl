
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import type {
  UseHandlers, UseModel,
  DefaultErrorHandler,
} from "@appril/crud/client";

import { handlersFactory } from "@appril/crud/client";

import { useStore } from "@crud:virtual-module-placeholder/store";

import {
  type ItemT,
  type ItemI,
  type ItemU,
  type ItemAssetsT,
  type EnvT,
  apiTypes, regularColumns,
  zodSchema, zodErrorHandler,
} from "@crud:virtual-module-placeholder/assets";

import { api } from "@crud:virtual-module-placeholder/api";

const store = useStore()

let defaultErrorHandler: DefaultErrorHandler

export const useHandlers: UseHandlers<
  ItemT,
  ItemI,
  ItemU,
  ItemAssetsT,
  EnvT
> = (opt) => {

  const router = useRouter()
  const route = useRoute()

  if (opt?.errorHandler && !defaultErrorHandler) {
    defaultErrorHandler = opt.errorHandler
  }

  const errorHandler = opt?.errorHandler || defaultErrorHandler

  return handlersFactory<
    ItemT,
    ItemI,
    ItemU,
    ItemAssetsT,
    EnvT
  >({
    store,
    router,
    route,
    api,
    apiTypes,
    zodSchema,
    zodErrorHandler,
    errorHandler,
  })

}

export const useModel: UseModel<
  ItemT
> = function useModel(
  opt,
) {

  const modelColumns: (keyof ItemT)[] = [ ...opt?.columns || regularColumns ]

  const model = ref<Partial<ItemT>>(
    modelColumns.reduce((a,c) => {
      return {
        ...a,
        [c]: store.item?.[c],
      }
    }, {})
  )

  if (opt?.reactive !== false) {

    const { updateItem, itemUpdated } = useHandlers()

    for (const col of modelColumns) {
      watch(
        () => model.value[col as string],
        // without async there are issues with error handling
        async (val) => await updateItem({ [col]: val } as Partial<ItemU>).then(itemUpdated)
      )
    }

  }

  return model

}

