
import { type StoreOnActionListener, defineStore } from "pinia";

import type { StoreState, StoreGetters, StoreActions } from "@appril/crud/client";

export default function storeFactory<
  ItemT,
  EnvT,
  ListAssetsT,
  ItemAssetsT
>(
  {
    modelName,
    primaryKey,
  }: {
    modelName: string;
    primaryKey: keyof ItemT;
  },
) {

  type StateT = StoreState<ItemT, EnvT, ListAssetsT, ItemAssetsT>
  type GettersT = StoreGetters<ItemT, EnvT, ListAssetsT, ItemAssetsT>
  type ActionsT = StoreActions<ItemT, EnvT, ListAssetsT, ItemAssetsT>

  const useStore = defineStore<
    typeof modelName,
    StateT,
    GettersT,
    ActionsT
  >(modelName, {

    state: () => {
      return {
        primaryKey,
        env: {} as EnvT,
        listItems: [],
        listPager: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 0,
          nextPage: 0,
          prevPage: 0,
          offset: 0,
        },
        listAssets: undefined,
        item: undefined,
        itemAssets: undefined,
        itemEvent: { event: undefined, id: undefined },
        loading: false,
        createDialog: false,
      }
    },

    actions: {

      setEnv(
        env,
      ) {
        this.$patch((state) => {
          state.env = env
        })
      },

      setListItems(
        items,
      ) {
        this.$patch((state) => {
          state.listItems = [ ...items ]
        })
      },

      setListPager(
        pager,
      ) {
        this.$patch((state) => {
          state.listPager = pager
        })
      },

      setListAssets(
        assets,
      ) {
        this.$patch((state) => {
          state.listAssets = assets
        })
      },

      setItem(
        item,
      ) {
        this.$patch((state) => {
          state.item = item
        })
      },

      setItemAssets(
        itemAssets,
      ) {
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
        this.$patch((state) => {
          if (state.item && updates) {
            state.item = { ...state.item, ...updates }
          }
        })
      },

      patchItemAssets(
        updates,
      ) {
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
            for (const item of state.listItems) {
              // @ts-expect-error
              if (item?.[primaryKey] == id) {
                Object.assign(item, updates)
              }
            }
          }
        })
      },

      unshiftItem(
        item,
      ) {
        this.$patch((state) => {
          state.listItems.unshift(
            // @ts-expect-error
            item
          )
        })
      },

      async removeItem(
        id,
      ) {
        this.$patch((state) => {
          state.listItems = state.listItems.filter((e: any) => e[primaryKey] != id)
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

        // @ts-expect-error
        const id = item?.[primaryKey]

        if (id) {
          after(() => {
            if (!store.listItems.some((e: any) => e[primaryKey] === id)) {
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
          // @ts-expect-error
          id: store.item?.[primaryKey],
        }
      }
      else if (name === "removeItem") {
        store.itemEvent = { event: "Deleted", id: args[0] }
      }

    },

  ]

  return {
    useStore,
    get actionListeners() { return [ ...actionListeners ] },
    set actionListeners(_) { throw "actionListeners is readonly" },
  }

}

