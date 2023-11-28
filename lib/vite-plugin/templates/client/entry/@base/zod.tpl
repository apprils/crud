{{BANNER}}

import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export const zodColumns = {
{{#columns}}
  {{#zodSchema}}
  {{name}}: {{zodSchema}},
  {{/zodSchema}}
{{/columns}}
}

type Column = keyof typeof zodColumns

export function zodSchema(
  dataset: Partial<Record<Column, any>>,
) {
  const columns = Object.keys(dataset) as Column[]
  return z.object(
    columns.reduce((acc, col) => ({ ...acc, [col]: zodColumns[col] }), {})
  )
}

export function zodErrorHandler(
  error: any,
) {
  return fromZodError(error, {
    prefix: null,
    issueSeparator: ";\n",
  })
}

