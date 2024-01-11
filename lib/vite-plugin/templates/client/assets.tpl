
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

import type { ApiTypesLiteral } from "@appril/crud/client";

export type {
  RecordT as ItemT,
  InsertT as ItemI,
  UpdateT as ItemU,
} from "@appril/dbx:{{declaredName}}";

export type {
  EnvT,
  ListAssetsT,
  ItemAssetsT,
} from "@crud:virtual-module-placeholder/apiTypes";

export const primaryKey = "{{primaryKey}}";

export const modelName = "{{modelName}}";

export const apiBase = "{{apiBase}}";

export const apiTypes: ApiTypesLiteral = {{apiTypesLiteral}};

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

