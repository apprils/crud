
import type { Ref, UnwrapRef } from "vue";
import type { Store } from "pinia";

export type ItemId = number | string
export type GenericObject = Record<string, any>

export type EnvResponse<EnvT> = UnwrapRef<EnvT | undefined>

export type ListResponse<ItemT> = UnwrapRef<{
  items: ItemT[];
  pager: Pager;
}>

export type RetrieveResponse<ItemT, ItemAssetsT> = UnwrapRef<{
  item: ItemT;
  assets: ItemAssetsT;
}>

export type Pager = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  nextPage: number;
  prevPage: number;
  offset: number;
}

export type StoreState<ItemT, ItemAssetsT, EnvT> = {
  primaryKey: keyof ItemT;
  env: EnvT;
  items: ItemT[];
  item: ItemT | undefined;
  itemAssets: ItemAssetsT | undefined;
  itemEvent: StoreItemEvent;
  loading: boolean;
  pager: Pager;
  createDialog: boolean;
}

export type StoreItemEvent = {
  event: "Created" | "Updated" | "Deleted" | undefined;
  id: ItemId | undefined;
}

export type StoreGetters<ItemT, ItemAssetsT, EnvT> = {}

export type StoreActions<ItemT, ItemAssetsT, EnvT> = {

  setEnv: (
    env: UnwrapRef<EnvT>,
  ) => void;

  setItems: (
    items: UnwrapRef<ItemT[]>,
    pager: Pager,
  ) => void;

  setItem: (
    item: UnwrapRef<ItemT>,
  ) => void;

  setItemAssets: (
    itemAssets: UnwrapRef<ItemAssetsT>,
  ) => void;

  insertItem: (
    id: ItemId,
    item: ItemT,
  ) => void;

  patchItem: (
    updates: Partial<UnwrapRef<ItemT>>,
  ) => void;

  patchItemAssets: (
    updates: UnwrapRef<ItemAssetsT>,
  ) => void;

  updateItem: (
    _id: ItemId,
    updates: Partial<UnwrapRef<ItemT>>,
  ) => void;

  unshiftItem: (
    item: UnwrapRef<ItemT>,
  ) => void;

  removeItem: (
    _id: ItemId,
  ) => Promise<void>;

}

export type UseStore<
  Id extends string,
  ItemT,
  ItemAssetsT,
  EnvT
> = () => Store<
  Id,
  StoreState<ItemT, ItemAssetsT, EnvT>,
  StoreGetters<ItemT, ItemAssetsT, EnvT>,
  StoreActions<ItemT, ItemAssetsT, EnvT>
>

export type DefaultErrorHandler = (e: any) => any

export type UseHandlers<
  ItemT,
  ItemI,
  ItemU,
  ItemAssetsT,
  EnvT,
> = (
  opt?: {
    errorHandler?: DefaultErrorHandler;
  },
) => Handlers<
  ItemT,
  ItemI,
  ItemU,
  ItemAssetsT,
  EnvT
>

export type Handlers<
  ItemT,
  ItemI,
  ItemU,
  ItemAssetsT,
  EnvT,
> = {

  loadEnv: (
    query?: GenericObject,
  ) => Promise<EnvT>;

  envLoaded: (
    env: EnvResponse<EnvT>,
  ) =>  EnvResponse<EnvT>;

  loadItems: (
    query?: GenericObject,
  ) => Promise<ListResponse<ItemT>>;

  itemsLoaded: (
    response: ListResponse<ItemT> | void,
  ) => void;

  loadItem: (
    id: ItemId,
  ) => Promise<RetrieveResponse<ItemT, ItemAssetsT>>;

  itemLoaded: (
    { item, assets }: RetrieveResponse<ItemT, ItemAssetsT>,
  ) => void;

  createItem: (
    dataset: ItemI,
  ) => Promise<ItemT>;

  itemCreated: (
    item: ItemT,
  ) => ItemT;

  $updateItem: (
    id: ItemId,
    dataset: Partial<ItemU>,
  ) => Promise<ItemT>;

  updateItem: (
    dataset: Partial<ItemU>,
  ) => Promise<ItemT>;

  itemUpdated: (
    item: Partial<ItemT>,
  ) => Partial<ItemT>;

  $deleteItem: (
    id: ItemId,
  ) => Promise<ItemT>;

  deleteItem: () => Promise<ItemT>;

  itemDeleted: (
    item: ItemT,
  ) => ItemT;

  gotoItem: (
    item: ItemT,
  ) => void;

  closeItem: () => Promise<any>;

  itemRoute: (
    item?: ItemT,
  ) => { query: Record<string, any> };

  isActiveItem: (
    item: ItemT,
  ) => boolean;

  gotoPrevPage: () => Promise<any>;

  gotoPage: (
    _page?: number | string | undefined,
  ) => Promise<any>;

  filtersModel: Ref<Record<string, any>>;

  $applyFilters: (
    model: Record<string, any>,
  ) => Promise<ListResponse<ItemT> | void>;

  applyFilters: () => Promise<ListResponse<ItemT> | void>;

  $resetFilters: (
    model: Record<string, any>,
  ) => Promise<ListResponse<ItemT> | void>;

  resetFilters: () => Promise<ListResponse<ItemT> | void>;

}

export type UseModel<ItemT> = (
  opt?: {
    columns?: (keyof ItemT)[];
    reactive?: boolean;
  },
) => Ref<Partial<ItemT>>

export type ApiTypes = {
  EnvT?: string;
  ItemAssetsT?: string;
}

