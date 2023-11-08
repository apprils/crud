
import type {
  {{recordName}} as ItemT,
  {{insertName}} as ItemI,
  {{updateName}} as ItemU,
} from "{{typesDir}}/{{schema}}/@types";

export type { ItemT, ItemI, ItemU }

// Item Serialized
// item with extra properties used on listing, retrieve, store
export type ItemS = ItemT

export type EnvT = never

