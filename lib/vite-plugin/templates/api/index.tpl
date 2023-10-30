{{BANNER}}

import type { CrudSetup } from "@appril/crud";
import { crudspecs } from "@appril/crud";
import { zodErrorHandler } from "{{crudDir}}/zod";

{{#tables}}

import type { {{queryBuilder}} } from "{{typesDir}}/{{schema}}/@types";
import type { ItemS as {{recordName}} } from "{{crudDir}}/{{name}}/types";
import { {{declaredName}} } from "{{tablesDir}}/{{schema}}/@index";
import { {{varName}}ZodI, {{varName}}ZodU } from "{{crudDir}}/zod";

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

