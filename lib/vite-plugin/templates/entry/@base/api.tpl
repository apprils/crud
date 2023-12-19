{{BANNER}}

import crudFactory from "@appril/crud/api";

import type { {{recordName}}, {{queryBuilder}} } from "{{typesImportBase}}/{{schema}}/@types";
import { {{declaredName}} } from "{{tablesImportBase}}/{{schema}}/@index";

import { zodSchema, zodErrorHandler } from "./zod";

export default crudFactory<
  {{recordName}},
  {{queryBuilder}}
>(
  {{declaredName}},
  {
    columns: [
      {{#regularColumns}}
      "{{name}}",
      {{/regularColumns}}
    ],
    primaryKey: "{{primaryKey}}",
    zodSchema,
    zodErrorHandler,
  }
)

