{{BANNER}}

import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import type { GenericObject, ListResponse, ItemId } from "{{crudDir}}/types";

import type { ItemT, ItemI, ItemU, ItemS, EnvT } from "./types";

import { store, api } from "./base";

import { {{varName}}ZodSchema as zodSchema, zodErrorHandler } from "{{crudDir}}/zod";

let errorHandler: (e: any) => any

export function useHandlers(opts: {
  errorHandler?: typeof errorHandler;
} = {}) {

  const router = useRouter()
  const route = useRoute()

  if (opts.errorHandler && !errorHandler) {
    errorHandler = opts.errorHandler
  }

  const $errorHandler: typeof errorHandler = (e) => {
    opts.errorHandler?.(e) || errorHandler?.(e)
    throw e
  }

  function loadEnv(
    query?: GenericObject,
  ) {
    store.loading = true
    return api
      .get<EnvT>("env", query || route.query)
      .catch($errorHandler)
      .finally(() => store.loading = false)
  }

  function envLoaded(
    env: EnvT | undefined,
  ) {
    if (env) {
      store.setEnv(env)
    }
    return env
  }

  function loadItems(
    query?: GenericObject,
  ): Promise<ListResponse<ItemS>> {
    store.loading = true
    return api
      .get<ListResponse<ItemS>>("list", query || route.query)
      .catch($errorHandler)
      .finally(() => store.loading = false)
  }

  function itemsLoaded(
    response: ListResponse<ItemS> | void,
  ) {
    if (response) {
      store.setItems(response.items, response.pager)
    }
  }

  function loadItem(
    id: ItemId,
  ): Promise<ItemS> {
    store.loading = true
    return api
      .get<ItemS>(id)
      .catch($errorHandler)
      .finally(() => store.loading = false)
  }

  function itemLoaded(
    item: ItemS,
  ) {
    store.setItem(item)
    window.scrollTo(0, 0)
  }

  function createItem(
    data: ItemI,
  ): Promise<ItemT> {
    try {
      zodSchema.parse(data)
    }
    catch (e: any) {
      return $errorHandler(zodErrorHandler(e))
    }
    store.loading = true
    return api
      .post<ItemT>(data)
      .catch($errorHandler)
      .finally(() => store.loading = false)
  }

  function itemCreated(
    item: ItemT,
  ) {
    router
      .push(itemRoute(item))
      .then(() => store.insertItem(item.{{primaryKey}}, item))
    return item
  }

  function $updateItem(
    id: ItemId,
    data: ItemU,
  ): Promise<ItemT> {
    try {
      zodSchema.parse(data)
    }
    catch (e: any) {
      return $errorHandler(zodErrorHandler(e))
    }
    store.loading = true
    return api
      .patch<ItemT>(id, data)
      .catch($errorHandler)
      .finally(() => store.loading = false)
  }

  function updateItem(
    data: ItemU,
  ): Promise<ItemT> {
    return store.item
      ? $updateItem(store.item.{{primaryKey}}, data)
      : Promise.reject("store.item is undefined")
  }

  function itemUpdated(
    item: ItemT,
  ) {
    const { {{primaryKey}}: id, ...updates } = item
    store.updateItem(id, updates as Partial<ItemT>)
    return item
  }

  function $deleteItem(
    id: ItemId,
  ): Promise<ItemT> {
    store.loading = true
    return api
      .delete<ItemT>(id)
      .catch($errorHandler)
      .finally(() => store.loading = false)
  }

  function deleteItem(): Promise<ItemT> {
    return store.item
      ? $deleteItem(store.item.{{primaryKey}})
      : Promise.reject("store.item is undefined")
  }

  function itemDeleted(
    item: ItemT,
  ) {
    const { {{primaryKey}}: id } = item
    store.removeItem(id).then(closeItem).then(gotoPrevPage)
    return item
  }

  function gotoItem(
    item: ItemT,
  ) {
    return router.push(itemRoute(item))
  }

  function closeItem() {
    store.item = undefined
    return router.push(itemRoute())
  }

  function itemRoute(
    item?: ItemS,
  ) {
    return {
      query: {
        ...route.query,
        _id: item?.{{primaryKey}} || undefined,
      }
    }
  }

  function itemKey(
    item: ItemS | undefined,
    prefix: string = "",
  ): string {
    return [ prefix || "", item?.{{primaryKey}} || "" ].map(String).join(":")
  }

  function isActiveItem(
    item: ItemS,
  ) {
    return store.item
      ? item?.{{primaryKey}} == store.item.{{primaryKey}}
      : false
  }

  function gotoPrevPage() {
    const _page = Number(route.query._page || 0)
    return !store.items.length && _page > 1
      ? router.replace({ query: { ...route.query, _page: _page - 1 } })
      : Promise.resolve()
  }

  function gotoPage(
    _page?: number | string | undefined,
  ) {
    return router.push({ query: { ...route.query, _page } })
  }

  const filtersModel = ref({ ...route.query })

  function $applyFilters(model: typeof filtersModel) {
    return router.push({ query: { ...route.query, ...model.value, _page: undefined } })
      .then(() => loadItems())
      .then(itemsLoaded)
  }

  function applyFilters() {
    return $applyFilters(filtersModel)
  }

  function $resetFilters(model: typeof filtersModel) {
    model.value = Object.keys(model.value).reduce((m,k) => ({ ...m, [k]: undefined }), {})
    return router.push({ query: { ...route.query, ...model.value, _page: undefined } })
      .then(() => loadItems())
      .then(itemsLoaded)
  }

  function resetFilters() {
    return $resetFilters(filtersModel)
  }

  return {
    loadEnv, envLoaded,
    loadItems, itemsLoaded,
    loadItem, itemLoaded,
    createItem, itemCreated,
    $updateItem, updateItem, itemUpdated,
    $deleteItem, deleteItem, itemDeleted,
    isActiveItem, closeItem,
    itemRoute, itemKey,
    gotoItem, gotoPrevPage, gotoPage,
    filtersModel, $applyFilters, applyFilters, $resetFilters, resetFilters,
  }

}

