{{BANNER}}

import { z } from "zod";
import { fromZodError } from "zod-validation-error";

{{#tables}}
{{#zodImports}}
import { {{import}} as {{as}} } from "{{from}}";
{{/zodImports}}
{{/tables}}

{{#tables}}

export const {{varName}}ZodSchema = z.object({
{{#columns}}
  {{#zodSchema}}
  {{name}}: {{zodSchema}},
  {{/zodSchema}}
{{/columns}}
}).strict()

{{/tables}}

export function zodErrorHandler(error: any) {
  return fromZodError(error, {
    prefix: null,
    issueSeparator: ";\n",
  })
}

