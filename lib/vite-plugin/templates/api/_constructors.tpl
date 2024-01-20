{{BANNER}}

import { fromZodError } from "zod-validation-error";

{{factoryCode}}

{{#tables}}
{{! prepending basename cause aliases importing same names as tables }}
import { {{declaredName}} as {{basename}}{{declaredName}} } from "{{tablesImportBase}}";

export const {{basename}} = $crudHandlersFactory<
  "{{declaredName}}",
  import("@dbx:{{declaredName}}").RecordT,
  import("@dbx:{{declaredName}}").InsertT,
  import("@dbx:{{declaredName}}").UpdateT,
  import("@dbx:{{declaredName}}").RecordT["{{primaryKey}}"]
>(
  {{basename}}{{declaredName}},
  {
    primaryKey: "{{primaryKey}}",
    columns: [
      {{#regularColumns}}
      "{{name}}",
      {{/regularColumns}}
    ],
    zodSchema: {
    {{#columns}}
      {{#zodSchema}}
      {{name}}: {{zodSchema}},
      {{/zodSchema}}
    {{/columns}}
    },
    zodErrorHandler,
  }
)

{{/tables}}

function zodErrorHandler(
  error: any,
) {
  return fromZodError(error, {
    prefix: null,
    issueSeparator: ";\n",
  })
}

