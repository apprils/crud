
import type { StoreGeneric, StoreOnActionListener } from "pinia";

import type {
  StoreOptions, StoreState, StoreGetters, StoreActions,
  GenericObject, Pager, ItemId,
} from "./types";

export function storeState<ItemT, EnvT>(
  {
    primaryKey,
  }: StoreOptions<ItemT>
): StoreState<ItemT, EnvT> {

  return {
    primaryKey,
    env: {} as EnvT,
    items: [],
    item: undefined,
    itemEvent: { event: undefined, id: undefined },
    loading: false,
    pager: {
      totalItems: 0,
      totalPages: 0,
      currentPage: 0,
      nextPage: 0,
      prevPage: 0,
      offset: 0,
    },
    createDialog: false,
  }

}

export function storeGetters() {
  return {}
}

export function storeActions() {
  return {

    setEnv(
      this: StoreGeneric,
      env: GenericObject,
    ) {
      // $patch({ env }) would cause cache issues with complex/nested items
      this.$patch((state) => state.env = { ...env })
    },

    setItems(
      this: StoreGeneric,
      items: any[],
      pager: Pager,
    ) {
      // $patch({ items, pager }) would cause cache issues with complex/nested items
      this.$patch((state) => {
        state.items = [ ...items ]
        state.pager = { ...pager }
      })
    },

    setItem(
      this: StoreGeneric,
      item: any,
    ) {
      // $patch({ item }) would cause cache issues with complex/nested items
      this.$patch((state) => state.item = { ...state.item, ...item })
    },

    insertItem(
      id: ItemId,
      item: any,
    ) {
      // signalling item created
    },

    patchItem(
      this: StoreGeneric,
      updates: any,
    ) {
      // $patch({ item }) would cause cache issues with complex/nested items
      this.$patch((state) => state.item = { ...state.item, ...updates })
    },

    updateItem(
      this: StoreGeneric,
      id: ItemId,
      updates: any,
    ) {
      this.$patch((state) => {
        Object.assign(state.item || {}, updates)
        for (const item of state.items) {
          if (item[state.primaryKey] == id) {
            Object.assign(item, updates)
          }
        }
      })
    },

    unshiftItem(
      this: StoreGeneric,
      item: any,
    ) {
      this.items.unshift(item)
    },

    async removeItem(
      this: StoreGeneric,
      id: ItemId,
    ) {
      this.$patch((state) => state.items = state.items.filter((e: any) => e[state.primaryKey] != id))
    },

  }

}

export const storeActionListeners: StoreOnActionListener<
  any,
  StoreState<any, any>,
  StoreGetters<any, any>,
  StoreActions<any, any>
>[] = [

  function({ store, name, args, after }) {

    if (name === "setItem") {
      const [ item ] = args
      const id = item?.[store.primaryKey]
      if (id) {
        after(() => {
          if (!store.items.some((e) => e[store.primaryKey] == id)) {
            store.unshiftItem(item)
          }
        })
      }
      return
    }

    const [ id ] = args

    if (name === "insertItem") {
      store.itemEvent = { event: "Created", id }
    }
    else if (name === "updateItem") {
      store.itemEvent = { event: "Updated", id }
    }
    else if (name === "removeItem") {
      store.itemEvent = { event: "Deleted", id }
    }

  },

]

