
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { z } from "zod";

import type {
  ItemId, UseHandlers, UseModel, GenericObject,
  ListResponse, RetrieveResponse, DefaultErrorHandler,
} from "@appril/crud/client";

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

  const filtersModel = ref({ ...route.query })

  const validatedDataset = (dataset: ItemI | ItemU) => {

    if (!zodSchema) {
      return dataset
    }

    const zodObject = z.object(
      Object.keys(dataset).reduce((acc, col) => ({
        ...acc,
        [col]: zodSchema[col],
      }), {})
    )

    zodObject.parse(dataset)

    return dataset

  }

  const handlers: ReturnType<typeof useHandlers> = {

    loadEnv(
      query?: GenericObject,
    ) {

      if (apiTypes?.EnvT) {
        store.loading = true
        return api
          .get<EnvT>("env", query || route.query)
          .catch(errorHandler)
          .finally(() => store.loading = false)
      }

      return Promise.resolve(undefined)

    },

    envLoaded(
      env,
    ) {
      if (env) {
        store.setEnv(env)
      }
      return env
    },

    loadItems(
      query,
    ) {
      store.loading = true
      return api
        .get<ListResponse<ItemT>>("list", query || route.query)
        .catch(errorHandler)
        .finally(() => store.loading = false)
    },

    itemsLoaded(
      response,
    ) {
      if (response) {
        store.setItems(response.items, response.pager)
      }
    },

    loadItem(
      id,
    ) {
      store.loading = true
      return api
        .get<RetrieveResponse<ItemT, ItemAssetsT>>(id)
        .catch(errorHandler)
        .finally(() => store.loading = false)
    },

    itemLoaded(
      { item, assets },
    ) {
      store.setItem(item)
      store.setItemAssets(assets)
      window.scrollTo(0, 0)
    },

    createItem(
      dataset,
    ) {
      try {
        dataset = validatedDataset(dataset)
      }
      catch(error: any) {
        return Promise.reject(errorHandler(zodErrorHandler?.(error) || error))
      }
      store.loading = true
      return api
        .post<Partial<ItemT>>(dataset)
        .catch(errorHandler)
        .finally(() => store.loading = false)
    },

    itemCreated(
      item,
    ) {
      router
        .push(handlers.itemRoute(item))
        .then(() => {
          store.insertItem(item[store.primaryKey], item)
        })
      return item
    },

    $updateItem(
      id,
      dataset,
    ) {
      try {
        dataset = validatedDataset(dataset)
      }
      catch(error: any) {
        return Promise.reject(errorHandler(zodErrorHandler?.(error) || error))
      }
      store.loading = true
      return api
        .patch<Partial<ItemT>>(id, dataset)
        .catch(errorHandler)
        .finally(() => store.loading = false)
    },

    updateItem(
      dataset,
    ) {
      if (store.item) {
        return handlers.$updateItem(store.item[store.primaryKey], dataset)
      }
      return Promise.reject(errorHandler("store.item is undefined"))
    },

    itemUpdated(
      item,
    ) {
      const { [store.primaryKey as string]: id, ...updates } = item
      store.updateItem(
        id as ItemId,
        updates,
      )
      return item
    },

    $deleteItem(
      id,
    ) {
      store.loading = true
      return api
        .delete<ItemT>(id)
        .catch(errorHandler)
        .finally(() => store.loading = false)
    },

    deleteItem() {
      if (store.item) {
        return handlers.$deleteItem(store.item[store.primaryKey])
      }
      return Promise.reject(errorHandler("store.item is undefined"))
    },

    itemDeleted(
      item,
    ) {
      const { [store.primaryKey]: id } = item
      store.removeItem(id)
        .then(handlers.closeItem)
        .then(handlers.gotoPrevPage)
      return item
    },

    gotoItem(
      item,
    ) {
      return router.push(handlers.itemRoute(item))
    },

    closeItem() {
      store.item = undefined
      return router.push(handlers.itemRoute())
    },

    itemRoute(
      item,
    ) {
      return {
        query: {
          ...route.query,
          _id: item?.[store.primaryKey] || undefined,
        }
      }
    },

    isActiveItem(
      item,
    ) {
      if (!store.item) {
        return false
      }
      return item?.[store.primaryKey] == store.item[store.primaryKey]
    },

    gotoPrevPage() {
      const _page = Number(route.query._page || 0)
      return !store.items.length && _page > 1
        ? router.replace({ query: { ...route.query, _page: _page - 1 } })
        : Promise.resolve()
    },

    gotoPage(
      _page,
    ) {
      return router.push({ query: { ...route.query, _page } })
    },

    filtersModel,

    $applyFilters(
      model,
    ) {
      return router.push({ query: { ...route.query, ...model.value, _page: undefined } })
        .then(() => handlers.loadItems())
        .then(handlers.itemsLoaded)
    },

    applyFilters() {
      return handlers.$applyFilters(filtersModel)
    },

    $resetFilters(
      model,
    ) {
      model.value = Object.keys(model.value).reduce((m,k) => ({ ...m, [k]: undefined }), {})
      return router.push({ query: { ...route.query, ...model.value, _page: undefined } })
        .then(() => handlers.loadItems())
        .then(handlers.itemsLoaded)
    },

    resetFilters() {
      return handlers.$resetFilters(filtersModel)
    },

  }

  return handlers

}

export const useModel: UseModel<ItemT> = function useModel(
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

