{{BANNER}}

import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import type {
  GenericObject, ItemId,
  ListResponse, RetrieveResponse,
} from "@appril/crud/client";

import type { ItemT, ItemI, ItemU, ItemAssetsT, EnvT } from "./types";
import { store, api } from "./base";
import { zodSchema, zodErrorHandler } from "./zod";

type ListResponseT = ListResponse<ItemT>
type RetrieveResponseT = RetrieveResponse<ItemT, ItemAssetsT>

let defaultErrorHandler: (e: any) => any

const regularColumns = [
  {{#regularColumns}}
  "{{name}}",
  {{/regularColumns}}
] as const

type RegularColumn = typeof regularColumns[number]

export function useHandlers(opts: {
  errorHandler?: typeof defaultErrorHandler;
} = {}) {

  const router = useRouter()
  const route = useRoute()

  if (opts.errorHandler && !defaultErrorHandler) {
    defaultErrorHandler = opts.errorHandler
  }

  const errorHandler = opts.errorHandler || defaultErrorHandler

  function loadEnv(
    query?: GenericObject,
  ) {
    {{#apiTypes.EnvT}}
    store.loading = true
    return api
      .get<EnvT>("env", query || route.query)
      .catch(errorHandler)
      .finally(() => store.loading = false)
    {{/apiTypes.EnvT}}
    {{^apiTypes.EnvT}}
    return Promise.resolve(undefined)
    {{/apiTypes.EnvT}}
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
  ): Promise<ListResponseT> {
    store.loading = true
    return api
      .get<ListResponseT>("list", query || route.query)
      .catch(errorHandler)
      .finally(() => store.loading = false)
  }

  function itemsLoaded(
    response: ListResponseT | void,
  ) {
    if (response) {
      store.setItems(response.items, response.pager)
    }
  }

  function loadItem(
    id: ItemId,
  ): Promise<RetrieveResponseT> {
    store.loading = true
    return api
      .get<RetrieveResponseT>(id)
      .catch(errorHandler)
      .finally(() => store.loading = false)
  }

  function itemLoaded(
    { item, assets }: RetrieveResponseT,
  ) {
    store.setItem(item)
    store.setItemAssets(assets)
    window.scrollTo(0, 0)
  }

  function createItem(
    dataset: ItemI,
  ): Promise<ItemT> {
    try {
      zodSchema(dataset).parse(dataset)
    }
    catch (e: any) {
      return errorHandler(zodErrorHandler(e))
    }
    store.loading = true
    return api
      .post<Partial<ItemT>>(dataset)
      .catch(errorHandler)
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
    dataset: Partial<ItemU>,
  ): Promise<ItemT> {
    try {
      zodSchema(dataset).parse(dataset)
    }
    catch (e: any) {
      return errorHandler(zodErrorHandler(e))
    }
    store.loading = true
    return api
      .patch<Partial<ItemT>>(id, dataset)
      .catch(errorHandler)
      .finally(() => store.loading = false)
  }

  function updateItem(
    dataset: Partial<ItemU>,
  ): Promise<ItemT> {
    return store.item
      ? $updateItem(store.item.{{primaryKey}}, dataset)
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
      .catch(errorHandler)
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
    item?: ItemT,
  ) {
    return {
      query: {
        ...route.query,
        _id: item?.{{primaryKey}} || undefined,
      }
    }
  }

  function itemKey(
    item: ItemT | undefined,
    prefix: string = "",
  ): string {
    return [ prefix || "", item?.{{primaryKey}} || "" ].map(String).join(":")
  }

  function isActiveItem(
    item: ItemT,
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
    errorHandler,
  }

}

export function useModel(opts: {
  columns?: RegularColumn[];
  reactive?: boolean;
} = {}) {

  const modelColumns: RegularColumn[] = [ ...opts.columns || regularColumns ]

  const model = ref<Partial<ItemT>>(
    modelColumns.reduce((a,c) => ({ ...a, [c]: store.item?.[c] }), {})
  )

  if (opts.reactive !== false) {

    const { updateItem, itemUpdated } = useHandlers()

    for (const col of modelColumns) {
      watch(
        () => model.value[col],
        // without async there are issues with error handling
        async (val) => await updateItem({ [col]: val }).then(itemUpdated)
      )
    }

  }

  return model

}

