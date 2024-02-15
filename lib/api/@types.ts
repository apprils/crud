export type Config<ItemT = never> = {
  primaryKey: keyof ItemT;
  itemsPerPage: number;
  sidePages: number;
};
