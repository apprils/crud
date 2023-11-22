{{BANNER}}

import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export const zodSchema = z.object({
{{#columns}}
  {{#zodSchema}}
  {{name}}: {{zodSchema}},
  {{/zodSchema}}
{{/columns}}
}).strict()

export function zodErrorHandler(error: any) {
  return fromZodError(error, {
    prefix: null,
    issueSeparator: ";\n",
  })
}

