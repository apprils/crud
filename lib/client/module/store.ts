
import { defineStore } from "pinia";

import type { StoreOnActionListener, } from "pinia";

import type { StoreState, StoreGetters, StoreActions } from "@appril/crud/client";

import {
  type ItemT,
  type ItemAssetsT,
  type EnvT,
  primaryKey, modelName,
} from "@crud:virtual-module-placeholder/assets";

type StateT = StoreState<ItemT, ItemAssetsT, EnvT>
type GettersT = StoreGetters<ItemT, ItemAssetsT, EnvT>
type ActionsT = StoreActions<ItemT, ItemAssetsT, EnvT>

export const useStore = defineStore<
  typeof modelName,
  StateT,
  GettersT,
  ActionsT
>(modelName, {

  state: () => {
    return {
      primaryKey,
      env: {} as EnvT,
      items: [],
      item: undefined,
      itemAssets: undefined,
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
  },

  actions: {

    setEnv(
      env,
    ) {
      // $patch({ env }) would cause cache issues with complex/nested items
      this.$patch((state) => { state.env = env })
    },

    setItems(
      items,
      pager,
    ) {
      // $patch({ items, pager }) would cause cache issues with complex/nested items
      this.$patch((state) => {
        state.items = [ ...items ]
        state.pager = { ...pager }
      })
    },

    setItem(
      item,
    ) {
      // $patch({ item }) would cause cache issues with complex/nested items
      this.$patch((state) => {
        state.item = item
      })
    },

    setItemAssets(
      itemAssets,
    ) {
      // $patch({ itemAssets }) would cause cache issues with complex/nested items
      this.$patch((state) => {
        state.itemAssets = itemAssets
      })
    },

    insertItem(
      id,
      item,
    ) {
      // signalling item created
    },

    patchItem(
      updates,
    ) {
      // $patch({ item }) would cause cache issues with complex/nested items
      this.$patch((state) => {
        if (state.item && updates) {
          state.item = { ...state.item, ...updates }
        }
      })
    },

    patchItemAssets(
      updates,
    ) {
      // $patch({ itemAssets }) would cause cache issues with complex/nested items
      this.$patch((state) => {
        if (state.itemAssets && updates) {
          state.itemAssets = { ...state.itemAssets || {}, ...updates }
        }
      })
    },

    updateItem(
      id,
      updates,
    ) {
      this.$patch((state) => {
        if (state.item && updates) {
          state.item = { ...state.item, ...updates }
          for (const item of state.items) {
            if (item && item[primaryKey] == id) {
              Object.assign(item, updates)
            }
          }
        }
      })
    },

    unshiftItem(
      item,
    ) {
      this.items.unshift(item)
    },

    async removeItem(
      id,
    ) {
      this.$patch((state) => {
        state.items = state.items.filter((e) => e[primaryKey] != id)
      })
    },

  },

})

const actionListeners: StoreOnActionListener<
  typeof modelName,
  StateT,
  GettersT,
  ActionsT
>[] = [

  function({ store, name, args, after }) {

    if (name === "setItem") {

      const [ item ] = args

      const id = item?.[primaryKey]

      if (id) {
        after(() => {
          if (!store.items.some((e) => e[primaryKey] == id)) {
            store.unshiftItem(item)
          }
        })
      }
      return
    }

    if (name === "insertItem") {
      store.itemEvent = { event: "Created", id: args[0] }
    }
    else if (name === "updateItem") {
      store.itemEvent = { event: "Updated", id: args[0] }
    }
    else if (name === "patchItem") {
      store.itemEvent = {
        event: "Updated",
        id: store.item?.[primaryKey]
      }
    }
    else if (name === "removeItem") {
      store.itemEvent = { event: "Deleted", id: args[0] }
    }

  },

]

export default {
  useStore,
  get actionListeners() { return [ ...actionListeners ] },
  set actionListeners(_) { throw "actionListeners is readonly" },
}

