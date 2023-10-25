{{BANNER}}

import type { CrudSetup } from "@appril/crud";
import { crudspecs } from "@appril/crud";

{{#tables}}

import type { {{queryBuilder}}, {{recordName}} } from "{{typesDir}}/{{schema}}/@types";
import { {{declaredName}} } from "{{tablesDir}}/{{schema}}/@index";
import { {{varName}}ZodI, {{varName}}ZodU } from "{{zodPath}}";
{{/tables}}

import { zodErrorHandler } from "{{zodPath}}";

{{#tables}}

export const {{varName}} = <
  StateT = unknown,
  ContextT = unknown
>({ create, update, ...setup }: Partial<CrudSetup<{{queryBuilder}}, {{recordName}}, StateT, ContextT>> = {}) => {
  return crudspecs<{{queryBuilder}}, {{recordName}}, StateT, ContextT>({{declaredName}}, {
    create: {
      zodSchema: {{varName}}ZodI,
      zodErrorHandler,
      ...create
    },
    update: {
      zodSchema: {{varName}}ZodU,
      zodErrorHandler,
      ...update
    },
    ...setup
  })
}
{{/tables}}

export default {
{{#tables}}
  {{varName}},
{{/tables}}
}

