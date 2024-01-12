
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import type {
  UseHandlers, UseFilters, UseModel,
  DefaultErrorHandler,
} from "@appril/crud/client";

import handlersFactory from "@appril/crud:handlersFactory";

import { useStore } from "@crud:virtual-module-placeholder/store";

import {
  type ItemT,
  type ItemI,
  type ItemU,
  type EnvT,
  type ListAssetsT,
  type ItemAssetsT,
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
  EnvT,
  ListAssetsT,
  ItemAssetsT
> = (
  opt,
) => {

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
    EnvT,
    ListAssetsT,
    ItemAssetsT
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

export const useFilters: UseFilters<
  ItemT,
  ListAssetsT
> = function useFilters(
  params,
) {

  const router = useRouter()
  const route = useRoute()

  const model = ref(
    params.reduce(
      (a,p) => ({ ...a, [p]: route.query[p] }),
      {}
    )
  )

  const { loadItems, itemsLoaded } = useHandlers()

  const handlers: ReturnType<UseFilters<ItemT, ListAssetsT>> = {

    model: model.value,

    $apply(
      model,
    ) {
      return router.push({ query: { ...route.query, ...model.value, _page: undefined } })
        .then(() => loadItems())
        .then(itemsLoaded)
    },

    apply() {
      return handlers.$apply(model)
    },

    $reset(
      model,
    ) {
      for (const key of Object.keys(model.value)) {
        model.value[key] = undefined
      }
      return router.push({ query: { ...route.query, ...model.value, _page: undefined } })
        .then(() => loadItems())
        .then(itemsLoaded)
    },

    reset() {
      return handlers.$reset(model)
    },

  }

  return handlers

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

