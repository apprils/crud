import { useRouter, useRoute } from "vue-router";
import { type ZodTypeAny, z } from "zod";
import { type FetchMapper } from "@appril/more/fetch";

import type {
  ItemId,
  Handlers,
  GenericObject,
  ApiTypesLiteral,
  ListResponse,
  RetrieveResponse,
  DefaultErrorHandler,
  GenericStore,
} from "./@types";

export function handlersFactory<
  ItemT,
  ItemI,
  ItemU,
  EnvT,
  ListAssetsT,
  ItemAssetsT,
>({
  store,
  router,
  route,
  api,
  apiTypes,
  zodSchema,
  zodErrorHandler,
  errorHandler,
}: {
  store: GenericStore<ItemT, EnvT, ListAssetsT, ItemAssetsT>;
  router: ReturnType<typeof useRouter>;
  route: ReturnType<typeof useRoute>;
  api: FetchMapper;
  apiTypes: ApiTypesLiteral;
  zodSchema: Record<string, ZodTypeAny>;
  zodErrorHandler: (e: unknown) => void;
  errorHandler: DefaultErrorHandler;
}) {
  const validatedDataset = (dataset: unknown) => {
    if (!zodSchema || !dataset) {
      return dataset;
    }

    const zodObject = z.object(
      Object.keys(dataset).reduce((map: Record<string, ZodTypeAny>, col) => {
        map[col] = zodSchema[col];
        return map;
      }, {}),
    );

    zodObject.parse(dataset);

    return dataset;
  };

  const handlers: Handlers<
    ItemT,
    ItemI,
    ItemU,
    EnvT,
    ListAssetsT,
    ItemAssetsT
  > = {
    loadEnv(query?: GenericObject) {
      if (apiTypes?.EnvT) {
        store.loading = true;
        return api
          .get<EnvT>("env", query || route.query)
          .catch(errorHandler)
          .finally(() => {
            store.loading = false;
          });
      }

      return Promise.resolve(undefined);
    },

    envLoaded(env) {
      if (env) {
        store.setEnv(env);
      }
      return env;
    },

    loadItems(query) {
      store.loading = true;
      return api
        .get<ListResponse<ItemT, ListAssetsT>>("list", query || route.query)
        .catch(errorHandler)
        .finally(() => {
          store.loading = false;
        });
    },

    itemsLoaded(response) {
      if (response) {
        store.setListItems(response.items);
        store.setListPager(response.pager);
        store.setListAssets(response.assets);
      }
    },

    loadItem(id) {
      store.loading = true;
      return api
        .get<RetrieveResponse<ItemT, ItemAssetsT>>(id)
        .catch(errorHandler)
        .finally(() => {
          store.loading = false;
        });
    },

    itemLoaded({ item, assets }) {
      store.setItem(item);
      store.setItemAssets(assets);
      window.scrollTo(0, 0);
    },

    createItem(_dataset) {
      let dataset: ItemI;
      try {
        dataset = validatedDataset(_dataset) as ItemI;
      } catch (error: unknown) {
        return Promise.reject(
          errorHandler(zodErrorHandler ? zodErrorHandler(error) : error),
        );
      }
      store.loading = true;
      return api
        .post<ItemT>(dataset)
        .catch(errorHandler)
        .finally(() => {
          store.loading = false;
        });
    },

    itemCreated(item) {
      router.push(handlers.itemRoute(item)).then(() => {
        store.insertItem(
          // @ts-expect-error
          item[store.primaryKey],
          item,
        );
      });
      return item;
    },

    $updateItem(id, _dataset) {
      let dataset: ItemU;
      try {
        dataset = validatedDataset(_dataset) as ItemU;
      } catch (error: unknown) {
        return Promise.reject(
          errorHandler(zodErrorHandler ? zodErrorHandler(error) : error),
        );
      }
      store.loading = true;
      return api
        .patch<ItemT>(id, dataset)
        .catch(errorHandler)
        .finally(() => {
          store.loading = false;
        });
    },

    updateItem(dataset) {
      if (store.item) {
        return handlers.$updateItem(
          // @ts-expect-error
          store.item[store.primaryKey],
          dataset,
        );
      }
      return Promise.reject(errorHandler("store.item is undefined"));
    },

    itemUpdated(item) {
      const { [store.primaryKey]: id, ...updates } = item;
      store.updateItem(
        id as ItemId,
        // @ts-expect-error
        updates,
      );
      return item;
    },

    $deleteItem(id) {
      store.loading = true;
      return api
        .delete<ItemT>(id)
        .catch(errorHandler)
        .finally(() => {
          store.loading = false;
        });
    },

    deleteItem() {
      if (store.item) {
        return handlers.$deleteItem(
          // @ts-expect-error
          store.item[store.primaryKey],
        );
      }
      return Promise.reject(errorHandler("store.item is undefined"));
    },

    itemDeleted(item) {
      const { [store.primaryKey]: id } = item;
      store
        .removeItem(id as ItemId)
        .then(handlers.closeItem)
        .then(handlers.gotoPrevPage);
      return item;
    },

    gotoItem(item) {
      return router.push(handlers.itemRoute(item));
    },

    closeItem() {
      store.item = undefined;
      return router.push(handlers.itemRoute());
    },

    itemRoute(item) {
      // @ts-expect-error
      const _id = item?.[store.primaryKey] || undefined;
      return {
        query: {
          ...route.query,
          _id,
        },
      };
    },

    isActiveItem(item) {
      if (!store.item) {
        return false;
      }
      // @ts-expect-error
      const a = item?.[store.primaryKey];
      // @ts-expect-error
      const b = store.item[store.primaryKey];
      return !a || !b ? false : String(a) === String(b);
    },

    gotoPrevPage() {
      const _page = Number(route.query._page || 0);
      return !store.listItems.length && _page > 1
        ? router.replace({ query: { ...route.query, _page: _page - 1 } })
        : Promise.resolve();
    },

    gotoPage(_page) {
      return router.push({ query: { ...route.query, _page } });
    },
  };

  return handlers;
}
