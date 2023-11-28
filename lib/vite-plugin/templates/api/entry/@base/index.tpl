{{BANNER}}

import type { CrudSetup } from "@appril/crud/api";
import { crudspecs } from "@appril/crud/api";

import type { {{queryBuilder}} } from "{{typesDir}}/{{schema}}/@types";
import { {{declaredName}} } from "{{tablesDir}}/{{schema}}/@index";

import type { ItemS, EnvT } from "{{crudDir}}/{{basename}}/@base/types";
import { zodSchema, zodErrorHandler } from "{{crudDir}}/{{basename}}/@base/zod";

export default function {{basename}}<
  StateT = unknown,
  ContextT = unknown
>({ create, update, ...setup }: Partial<
  CrudSetup<
    {{queryBuilder}},
    ItemS,
    EnvT,
    StateT,
    ContextT
  >
> = {}) {
  return crudspecs<
    {{queryBuilder}},
    ItemS,
    EnvT,
    StateT,
    ContextT
  >({{declaredName}}, {
    create: {
      zodSchema,
      zodErrorHandler,
      ...create
    },
    update: {
      zodSchema,
      zodErrorHandler,
      ...update
    },
    ...setup
  })
}

