{{BANNER}}

import { reactive } from "vue";
import { useRoute, useRouter } from "vue-router";

import type { GenericObject, Filters, ListResponse, ItemId } from "../types";

import type { ItemT, ItemI, ItemU, ItemS, EnvT } from "./types";

import { store, api } from "./base";

import {
  {{varName}}ZodI as zodSchemaI,
  {{varName}}ZodU as zodSchemaU,
  zodErrorHandler,
} from "../zod";

export function loadEnv(
  query?: GenericObject,
) {
  const route = useRoute()
  store.loading = true
  return api
    .get<EnvT>("env", query || route.query)
    .finally(() => store.loading = false)
}

export function envLoaded(
  env: EnvT,
) {
  store.setEnv(env)
  return env
}

export function loadItems(
  query?: GenericObject,
) {
  const route = useRoute()
  store.loading = true
  return api
    .get<ListResponse<ItemS>>("list", query || route.query)
    .finally(() => store.loading = false)
}

export function itemsLoaded(
  response: ListResponse<ItemS> | void,
) {
  if (response) {
    store.setItems(response.items, response.pager)
  }
}

export function loadItem(
  id: ItemId,
) {
  store.loading = true
  return api
    .get<ItemS>(id)
    .finally(() => store.loading = false)
}

export function itemLoaded(
  item: ItemS,
) {
  store.setItem(item)
  window.scrollTo(0, 0)
}

export function createItem(
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

export function itemCreated(
  item: ItemT,
) {
  const router = useRouter()
  router
    .push(itemRoute(item))
    .then(() => store.insertItem(item.{{primaryKey}}, item))
  return item
}

export function $updateItem(
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

export function updateItem(
  data: ItemU,
) {
  return store.item
    ? $updateItem(store.item.{{primaryKey}}, data)
    : Promise.reject("store.item is undefined")
}

export function itemUpdated(
  item: ItemT,
) {
  const { {{primaryKey}}: id, ...updates } = item
  store.updateItem(id, updates as Partial<ItemT>)
  return item
}

export function $deleteItem(
  id: ItemId,
) {
  store.loading = true
  return api
    .delete<ItemT>(id)
    .finally(() => store.loading = false)
}

export function deleteItem() {
  return store.item
    ? $deleteItem(store.item.{{primaryKey}})
    : Promise.reject("store.item is undefined")
}

export function itemDeleted(
  item: ItemT,
) {
  const { {{primaryKey}}: id } = item
  store.removeItem(id).then(closeItem).then(gotoPrevPage)
  return item
}

export function gotoItem(
  item: ItemT,
) {
  const router = useRouter()
  return router.push(itemRoute(item))
}

export function closeItem() {
  store.item = undefined
  const router = useRouter()
  return router.push(itemRoute())
}

export function itemRoute(
  item?: ItemS,
) {
  const route = useRoute()
  return {
    query: {
      ...route.query,
      _id: item?.{{primaryKey}} || undefined,
    }
  }
}

export function itemKey(
  item: ItemS | undefined,
  prefix: string = "",
): string {
  return [ prefix || "", item?.{{primaryKey}} || "" ].map(String).join(":")
}

export function isActiveItem(
  item: ItemS,
) {
  return store.item
    ? item?.{{primaryKey}} == store.item.{{primaryKey}}
    : false
}

export function gotoPrevPage() {
  const router = useRouter()
  const route = useRoute()
  const _page = Number(route.query._page || 0)
  return !store.items.length && _page > 1
    ? router.replace({ query: { ...route.query, _page: _page - 1 } })
    : Promise.resolve()
}

export function gotoPage(
  _page?: number | string | undefined,
) {
  const router = useRouter()
  const route = useRoute()
  return router.push({ query: { ...route.query, _page } })
}

const filters: Filters = reactive<Filters>({
  model: {},
  apply: applyFilters,
  reset: resetFilters,
})

export function applyFilters() {
  const router = useRouter()
  const route = useRoute()
  return router.push({ query: { ...route.query, ...filters.model } })
    .then(() => loadItems())
    .then(itemsLoaded)
}

export function resetFilters() {
  const router = useRouter()
  const route = useRoute()
  filters.model = Object.keys(filters.model).reduce((m,k) => ({ ...m, [k]: undefined }), {})
  return router.push({ query: { ...route.query, ...filters.model, _page: undefined } })
    .then(() => loadItems())
    .then(itemsLoaded)
}

