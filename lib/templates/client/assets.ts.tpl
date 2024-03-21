import type { ApiTypesLiteral } from "@appril/crud";
import { fromZodError } from "zod-validation-error";

import { serialize, stringify } from "{{sourceFolder}}/../helpers/fetch";

export type {
  RecordT as ItemT,
  InsertT as ItemI,
  UpdateT as ItemU,
} from "{{dbxBase}}:{{name}}";

export type {
  EnvT,
  ListAssetsT,
  ItemAssetsT,
} from "./apiTypes";

export type PKeyT = import("{{dbxBase}}:{{name}}").RecordT["{{primaryKey}}"]

export const primaryKey = "{{primaryKey}}";

export const modelName = "{{modelName}}";

export const apiBase = "{{apiBase}}";

export const apiTypes: ApiTypesLiteral = {{apiTypesLiteral}};

export const fetchOptions = {
  ...serialize ? { serialize } : {},
  ...stringify ? { stringify } : {},
}

export const regularColumns = [
  {{#regularColumns}}
  "{{name}}",
  {{/regularColumns}}
] as const;

export function zodSchema(
  z: typeof import("zod").z,
) {
  return {
    {{#columns}}
    {{#zodSchema}}
    {{name}}: {{zodSchema}},
    {{/zodSchema}}
    {{/columns}}
  }
}

export function zodErrorHandler(
  error: any,
) {
  return fromZodError(error, {
    prefix: null,
    issueSeparator: ";\n",
  })
};
