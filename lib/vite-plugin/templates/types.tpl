
export type ItemId = number | string
export type GenericObject = Record<string, any>

export type ListResponse<ItemT> = {
  items: ItemT[];
  pager: Pager;
}

export type Pager = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  nextPage: number;
  prevPage: number;
  offset: number;
}

export type StoreOptions<ItemT> = {
  primaryKey: keyof ItemT;
}

export type StoreState<ItemT, EnvT> = {
  primaryKey: keyof ItemT,
  env: EnvT,
  items: ItemT[],
  item: ItemT | undefined,
  itemEvent: StoreItemEvent;
  loading: boolean,
  pager: Pager,
  createDialog: boolean;
}

export type StoreItemEvent = {
  event: "Created" | "Updated" | "Deleted" | undefined;
  id: ItemId | undefined;
}

export type StoreGetters<ItemT, EnvT> = {}

export type StoreActions<ItemT, EnvT> = {

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

  insertItem: (
    id: ItemId,
    item: ItemT,
  ) => void;

  patchItem: (
    updates: Partial<ItemT>,
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

export type Filters = {
  model: any;
  apply: () => Promise<void>;
  reset: () => Promise<void>;
}

