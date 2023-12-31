
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

import type { ApiTypes } from "@appril/crud/client";

export type {
  RecordT as ItemT,
  InsertT as ItemI,
  UpdateT as ItemU,
} from "@appril/dbx:{{declaredName}}";

export type { EnvT, ItemAssetsT } from "@crud:virtual-module-placeholder/apiTypes";

export const primaryKey = "{{primaryKey}}";

export const modelName = "{{modelName}}";

export const apiBase = "{{apiBase}}";

export const apiTypes: ApiTypes = {{apiTypesLiteral}};

export const regularColumns = [
  {{#regularColumns}}
  "{{name}}",
  {{/regularColumns}}
]

export const zodSchema = {
{{#columns}}
  {{#zodSchema}}
  {{name}}: {{zodSchema}},
  {{/zodSchema}}
{{/columns}}
}

export function zodErrorHandler(
  error: any,
) {
  return fromZodError(error, {
    prefix: null,
    issueSeparator: ";\n",
  })
}

