{{BANNER}}

import { reactive } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useStore, actionListeners } from "./store";

import type { GenericObject, Filters, ListResponse, ItemId } from "../types";

import fetch from "@/fetch";

import {
  {{varName}}ZodI as zodSchemaI,
  {{varName}}ZodU as zodSchemaU,
  zodErrorHandler,
} from "../zod";

import type { ItemT, ItemI, ItemU, ItemS, EnvT } from "./types";

export const modelName = "{{modelName}}"

export const store = useStore()

for (const listener of actionListeners) {
  store.$onAction(listener)
}

export const api = fetch("{{apiBase}}")

export { zodSchemaI, zodSchemaU }

export function useHandlers() {

  const router = useRouter()
  const route = useRoute()

  function loadEnv(
    query?: GenericObject,
  ) {
    store.loading = true
    return api
      .get<EnvT>("env", query || route.query)
      .finally(() => store.loading = false)
  }

  function envLoaded(
    env: EnvT,
  ) {
    store.setEnv(env)
    return env
  }

  function loadItems(
    query?: GenericObject,
  ) {
    store.loading = true
    return api
      .get<ListResponse<ItemS>>("list", query || route.query)
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
  ) {
    store.loading = true
    return api
      .get<ItemS>(id)
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
  ) {
    try {
      zodSchemaI.parse(data)
    }
    catch (e: any) {
      return Promise.reject(zodErrorHandler(e))
    }
    store.loading = true
    return api
      .post<ItemT>(data)
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
  ) {
    try {
      zodSchemaU.parse(data)
    }
    catch (e: any) {
      return Promise.reject(zodErrorHandler(e))
    }
    store.loading = true
    return api
      .patch<ItemT>(id, data)
      .finally(() => store.loading = false)
  }

  function updateItem(
    data: ItemU,
  ) {
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
  ) {
    store.loading = true
    return api
      .delete<ItemT>(id)
      .finally(() => store.loading = false)
  }

  function deleteItem() {
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

  const filters: Filters = reactive<Filters>({
    model: {},
    apply: applyFilters,
    reset: resetFilters,
  })

  function applyFilters() {
    return router.push({ query: { ...route.query, ...filters.model } })
      .then(() => loadItems())
      .then(itemsLoaded)
  }

  function resetFilters() {
    filters.model = Object.keys(filters.model).reduce((m,k) => ({ ...m, [k]: undefined }), {})
    return router.push({ query: { ...route.query, ...filters.model, _page: undefined } })
      .then(() => loadItems())
      .then(itemsLoaded)
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
    filters, applyFilters, resetFilters,
  }

}

