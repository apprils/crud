{{BANNER}}

import { defineStore } from "pinia";

import type { StoreOnActionListener } from "pinia";

import type {
  StoreState, StoreGetters, StoreActions,
  Pager, ItemId,
} from "@appril/crud/client";

import type { ItemT, ItemAssetsT, EnvT } from "./types";

import custom from "{{crudDir}}/store";

type StateT = StoreState<ItemT, ItemAssetsT, EnvT>
type GettersT = StoreGetters<ItemT, ItemAssetsT, EnvT>
type ActionsT = StoreActions<ItemT, ItemAssetsT, EnvT>

export const useStore = defineStore<
  "{{basename}}",
  StateT,
  GettersT,
  ActionsT
>("{{basename}}", {

  state: () => {
    return {
      primaryKey: "{{primaryKey}}",
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

  getters: {
    ...custom.getters,
  },

  actions: {

    setEnv(
      env: EnvT,
    ) {
      // $patch({ env }) would cause cache issues with complex/nested items
      this.$patch((state) => { state.env = env as EnvT })
    },

    setItems(
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
      item: any,
    ) {
      // $patch({ item }) would cause cache issues with complex/nested items
      this.$patch((state) => state.item = { ...state.item, ...item })
    },

    setItemAssets(
      itemAssets: any,
    ) {
      // $patch({ itemAssets }) would cause cache issues with complex/nested items
      this.$patch((state) => state.itemAssets = itemAssets)
    },

    insertItem(
      id: ItemId,
      item: any,
    ) {
      // signalling item created
    },

    patchItem(
      updates: any,
    ) {
      // $patch({ item }) would cause cache issues with complex/nested items
      this.$patch((state) => state.item = { ...state.item, ...updates })
    },

    patchItemAssets(
      updates: any,
    ) {
      // $patch({ itemAssets }) would cause cache issues with complex/nested items
      this.$patch((state) => state.itemAssets = { ...state.itemAssets, ...updates })
    },

    updateItem(
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
      item: any,
    ) {
      this.items.unshift(item)
    },

    async removeItem(
      id: ItemId,
    ) {
      this.$patch((state) => state.items = state.items.filter((e: any) => e[state.primaryKey] != id))
    },

    ...custom.actions,

  },

})

export const actionListeners: StoreOnActionListener<
  "{{basename}}",
  StateT,
  GettersT,
  ActionsT
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

    if (name === "insertItem") {
      store.itemEvent = { event: "Created", id: args[0] }
    }
    else if (name === "updateItem") {
      store.itemEvent = { event: "Updated", id: args[0] }
    }
    else if (name === "patchItem") {
      store.itemEvent = { event: "Updated", id: store.item?.[store.primaryKey] as ItemId }
    }
    else if (name === "removeItem") {
      store.itemEvent = { event: "Deleted", id: args[0] }
    }

  },

  ...custom.actionListeners,

]

