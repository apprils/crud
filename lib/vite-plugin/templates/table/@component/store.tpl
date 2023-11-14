{{BANNER}}

import { defineStore } from "pinia";

import type { StoreOnActionListener } from "pinia";

import type {
  StoreState, StoreGetters, StoreActions,
  GenericObject, Pager, ItemId,
} from "{{crudDir}}/types";

import type { ItemS, EnvT } from "./types";

import custom from "{{crudDir}}/store";

export const useStore = defineStore<
  "{{name}}",
  StoreState<ItemS, EnvT>,
  StoreGetters<ItemS, EnvT>,
  StoreActions<ItemS, EnvT>
>("{{name}}", {

  state: () => {
    return {
      primaryKey: "{{primaryKey}}",
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
  },

  getters: {
    ...custom.getters,
  },

  actions: {

    setEnv(
      env: GenericObject,
    ) {
      // $patch({ env }) would cause cache issues with complex/nested items
      this.$patch((state) => { state.env = { ...env } as EnvT })
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
  "{{name}}",
  StoreState<ItemS, EnvT>,
  StoreGetters<ItemS, EnvT>,
  StoreActions<ItemS, EnvT>
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
    else if (name === "removeItem") {
      store.itemEvent = { event: "Deleted", id: args[0] }
    }

  },

  ...custom.actionListeners,

]

