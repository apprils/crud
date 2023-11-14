{{BANNER}}

import type { CrudSetup } from "@appril/crud";
import { crudspecs } from "@appril/crud";
import { zodErrorHandler } from "{{crudDir}}/zod";

{{#tables}}

import type { {{queryBuilder}} } from "{{typesDir}}/{{schema}}/@types";

import type {
  ItemS as {{declaredName}}S,
  EnvT as {{declaredName}}EnvT,
} from "{{crudDir}}/{{name}}/@component/types";

import { {{declaredName}} } from "{{tablesDir}}/{{schema}}/@index";
import { {{varName}}ZodI, {{varName}}ZodU } from "{{crudDir}}/zod";

export const {{varName}} = <
  StateT = unknown,
  ContextT = unknown
>({ create, update, ...setup }: Partial<
  CrudSetup<
    {{queryBuilder}},
    {{declaredName}}S,
    {{declaredName}}EnvT,
    StateT,
    ContextT
  >
> = {}) => {
  return crudspecs<
    {{queryBuilder}},
    {{declaredName}}S,
    {{declaredName}}EnvT,
    StateT,
    ContextT
  >({{declaredName}}, {
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

