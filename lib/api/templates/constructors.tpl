{{BANNER}}

import { fromZodError } from "zod-validation-error";

{{factoryCode}}

{{#tables}}
{{! prepending basename cause aliases importing same names as tables }}
import { {{declaredName}} as {{basename}}{{declaredName}} } from "{{tablesImportBase}}";

export const {{basename}} = $crudHandlersFactory<
  import("@appril/dbx:{{declaredName}}").QueryT,
  import("@appril/dbx:{{declaredName}}").RecordT,
  import("@appril/dbx:{{declaredName}}").InsertT,
  import("@appril/dbx:{{declaredName}}").UpdateT
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

