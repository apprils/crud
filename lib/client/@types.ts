
export type ItemId = number | string
export type GenericObject = Record<string, any>

export type ListResponse<ItemT> = {
  items: ItemT[];
  pager: Pager;
}

export type RetrieveResponse<ItemT, ItemAssetsT> = {
  item: ItemT;
  assets: ItemAssetsT;
}

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
    env: EnvT,
  ) => void;

  setItems: (
    items: ItemT[],
    pager: Pager,
  ) => void;

  setItem: (
    item: ItemT,
  ) => void;

  setItemAssets: (
    itemAssets: ItemAssetsT,
  ) => void;

  insertItem: (
    id: ItemId,
    item: ItemT,
  ) => void;

  patchItem: (
    updates: Partial<ItemT>,
  ) => void;

  patchItemAssets: (
    updates: Partial<ItemAssetsT>,
  ) => void;

  updateItem: (
    _id: ItemId,
    updates: Partial<ItemT>,
  ) => void;

  unshiftItem: (
    item: ItemT,
  ) => void;

  removeItem: (
    _id: ItemId,
  ) => Promise<void>;

}

