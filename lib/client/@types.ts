
import type { Ref, UnwrapRef } from "vue";
import type { Store } from "pinia";

export type ItemId = number | string
export type GenericObject = Record<string, any>

export type EnvResponse<EnvT> = UnwrapRef<EnvT | undefined>

export type ListResponse<ItemT, ListAssetsT> = UnwrapRef<{
  items: ItemT[];
  pager: Pager;
  assets: ListAssetsT;
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

export type StoreState<
  ItemT,
  EnvT,
  ListAssetsT,
  ItemAssetsT
> = {
  primaryKey: keyof ItemT;
  env: EnvT;
  listItems: ItemT[];
  listPager: Pager;
  listAssets: ListAssetsT | undefined;
  item: ItemT | undefined;
  itemAssets: ItemAssetsT | undefined;
  itemEvent: StoreItemEvent;
  loading: boolean;
  createDialog: boolean;
}

export type StoreItemEvent = {
  event: "Created" | "Updated" | "Deleted" | undefined;
  id: ItemId | undefined;
}

export type StoreGetters<
  ItemT,
  EnvT,
  ListAssetsT,
  ItemAssetsT
> = {}

export type StoreActions<
  ItemT,
  EnvT,
  ListAssetsT,
  ItemAssetsT
> = {

  setEnv: (
    env: UnwrapRef<EnvT>,
  ) => void;

  setListItems: (
    items: UnwrapRef<ItemT[]>,
  ) => void;

  setListPager: (
    pager: Pager,
  ) => void;

  setListAssets: (
    assets: UnwrapRef<ListAssetsT>,
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
  EnvT,
  ListAssetsT,
  ItemAssetsT
> = () => Store<
  Id,
  StoreState<ItemT, EnvT, ListAssetsT, ItemAssetsT>,
  StoreGetters<ItemT, EnvT, ListAssetsT, ItemAssetsT>,
  StoreActions<ItemT, EnvT, ListAssetsT, ItemAssetsT>
>

export type DefaultErrorHandler = (e: any) => any

export type UseHandlers<
  ItemT,
  ItemI,
  ItemU,
  EnvT,
  ListAssetsT,
  ItemAssetsT
> = (
  opt?: {
    errorHandler?: DefaultErrorHandler;
  },
) => Handlers<
  ItemT,
  ItemI,
  ItemU,
  EnvT,
  ListAssetsT,
  ItemAssetsT
>

export type Handlers<
  ItemT,
  ItemI,
  ItemU,
  EnvT,
  ListAssetsT,
  ItemAssetsT
> = {

  loadEnv: (
    query?: GenericObject,
  ) => Promise<EnvT>;

  envLoaded: (
    env: EnvResponse<EnvT>,
  ) =>  EnvResponse<EnvT>;

  loadItems: (
    query?: GenericObject,
  ) => Promise<ListResponse<ItemT, ListAssetsT>>;

  itemsLoaded: (
    response: ListResponse<ItemT, ListAssetsT> | void,
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
  ) => Promise<ListResponse<ItemT, ListAssetsT> | void>;

  applyFilters: () => Promise<ListResponse<ItemT, ListAssetsT> | void>;

  $resetFilters: (
    model: Record<string, any>,
  ) => Promise<ListResponse<ItemT, ListAssetsT> | void>;

  resetFilters: () => Promise<ListResponse<ItemT, ListAssetsT> | void>;

}

export type UseModel<ItemT> = (
  opt?: {
    columns?: (keyof ItemT)[];
    reactive?: boolean;
  },
) => Ref<Partial<ItemT>>

export type ApiTypes = {
  EnvT?: string;
  ListAssetsT?: string;
  ItemAssetsT?: string;
}

export type ApiTypesLiteral = Record<keyof ApiTypes, boolean>

