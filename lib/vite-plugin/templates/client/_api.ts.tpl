
import { fetch } from "@appril/more/fetch";

import { apiBase } from "@crud:virtual-module-placeholder/assets";

export const api = fetch(apiBase, {
  errorHandler: undefined, // crud module uses own errorHandler
})

