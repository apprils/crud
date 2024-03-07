export type Pager = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  nextPage: number;
  prevPage: number;
  offset: number;
};

export type ApiTypes = {
  EnvT?: string;
  ListAssetsT?: string;
  ItemAssetsT?: string;
};

export type ApiTypesLiteral = Record<keyof ApiTypes, boolean>;
