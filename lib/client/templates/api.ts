import { fetch } from "@appril/more/fetch";

import { apiBase } from "./assets";

export const api = fetch(apiBase, {
  errorHandler: undefined, // crud module uses own errorHandler
});
