{{BANNER}}

import type {
  {{recordName}} as ItemT,
  {{insertName}} as ItemI,
  {{updateName}} as ItemU,
} from "{{typesDir}}/{{schema}}/@types";

import type {
  ItemX,
  EnvT,
} from "../types";

// ItemStored / ItemSerialized
type ItemS = ItemT & ItemX

export type { ItemT, ItemI, ItemU, ItemX, ItemS, EnvT };

