{{BANNER}}

import apiFactory from "@appril/crud/api";

import { z } from "zod";
import { fromZodError } from "zod-validation-error";

{{#tables}}
{{! prepending basename cause aliases importing same names as tables }}
import { {{declaredName}} as {{basename}}{{declaredName}} } from "{{tablesImportBase}}/{{schema}}/@index";

export const {{basename}} = apiFactory<
  import("{{typesImportBase}}/{{schema}}/@types").{{recordName}},
  import("{{typesImportBase}}/{{schema}}/@types").{{queryBuilder}}
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

