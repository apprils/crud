/// <reference path="../env.d.ts" />

import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  type UseHandlers,
  type UseFilters,
  type UseModel,
  type DefaultErrorHandler,
  handlersFactory,
} from "@appril/crud/client";

import { useStore } from "./store";

import {
  type ItemT,
  type ItemI,
  type ItemU,
  type EnvT,
  type ListAssetsT,
  type ItemAssetsT,
  apiTypes,
  regularColumns,
  zodSchema,
  zodErrorHandler,
} from "./assets";

import { api } from "./api";

const store = useStore();

let defaultErrorHandler: DefaultErrorHandler;

export const useHandlers: UseHandlers<
  ItemT,
  ItemI,
  ItemU,
  EnvT,
  ListAssetsT,
  ItemAssetsT
> = (opt) => {
  const router = useRouter();
  const route = useRoute();

  if (opt?.errorHandler && !defaultErrorHandler) {
    defaultErrorHandler = opt.errorHandler;
  }

  const errorHandler = opt?.errorHandler || defaultErrorHandler;

  return handlersFactory<ItemT, ItemI, ItemU, EnvT, ListAssetsT, ItemAssetsT>({
    // @ts-expect-error
    store,
    router,
    route,
    api,
    apiTypes,
    zodSchema,
    zodErrorHandler,
    errorHandler,
  });
};

export const useFilters: UseFilters = function useFilters(params) {
  const router = useRouter();
  const route = useRoute();

  const model = ref(
    params.reduce((map: Record<string, unknown>, param) => {
      map[param] = route.query[param];
      return map;
    }, {}),
  );

  const { loadItems, itemsLoaded } = useHandlers();

  const handlers: ReturnType<UseFilters> = {
    model: model.value,

    $apply(model) {
      return router
        .push({
          query: { ...route.query, ...(model.value || {}), _page: undefined },
        })
        .then(() => loadItems())
        .then(itemsLoaded);
    },

    apply() {
      return handlers.$apply(model);
    },

    $reset(model) {
      for (const key of Object.keys(model.value)) {
        model.value[key] = undefined;
      }
      return router
        .push({ query: { ...route.query, ...model.value, _page: undefined } })
        .then(() => loadItems())
        .then(itemsLoaded);
    },

    reset() {
      return handlers.$reset(model);
    },
  };

  return handlers;
};

export const useModel: UseModel<ItemT> = function useModel(opt) {
  const columns: (keyof ItemT)[] = [...(opt?.columns || regularColumns)];

  const model = ref<Partial<ItemT>>(
    columns.reduce((map: Record<string, unknown>, col) => {
      map[col] = store.item?.[col];
      return map;
    }, {}),
  );

  if (opt?.reactive !== false) {
    const { updateItem, itemUpdated } = useHandlers();

    for (const col of columns) {
      watch(
        () => model.value[col],
        // without async there are issues with error handling
        async (val) => {
          const updates = await updateItem({ [col]: val });
          itemUpdated(updates as Partial<ItemT>);
        },
      );
    }
  }

  return model;
};
