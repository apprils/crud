{{BANNER}}

import { z } from "zod";
import { fromZodError } from "zod-validation-error";

{{#tables}}
{{#zodImports}}
import { {{import}} as {{as}} } from "{{from}}";
{{/zodImports}}
{{/tables}}

{{#tables}}

export const {{varName}}ZodI = z.object({
{{#columns}}
  {{#zodSchema}}
  {{name}}: ((z) => {{zodSchemaRefine}})({{zodSchema}}),
  {{/zodSchema}}
{{/columns}}
})

export const {{varName}}ZodU = z.object({
{{#columns}}
  {{#zodSchema}}
  {{name}}: ((z) => {{zodSchemaRefine}}{{^isOptional}}.optional(){{/isOptional}})({{zodSchema}}),
  {{/zodSchema}}
{{/columns}}
})
{{/tables}}

export function zodErrorHandler(error: any) {
  return fromZodError(error, {
    prefix: null,
    issueSeparator: ";\n",
  })
}

