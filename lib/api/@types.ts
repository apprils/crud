
export type Config<ItemT = any> = {
  primaryKey: keyof ItemT;
  itemsPerPage: number;
  sidePages: number;
}

