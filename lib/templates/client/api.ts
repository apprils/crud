import { fetch } from "@appril/more/fetch";

import { apiBase, fetchOptions } from "./assets";

export const api = fetch(apiBase, {
  ...fetchOptions,
  errorHandler: undefined, // crud module uses own errorHandler
});
