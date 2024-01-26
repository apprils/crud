{{BANNER}}

import { fromZodError as apprilCrud$fromZodError } from "zod-validation-error";
import * as apprilCrud$apprilDbx$Tables from "{{dbxConfig.importBase}}/{{dbxConfig.base}}/base";

{{factoryCode}}

{{#tables}}
export const {{basename}} = $crudHandlersFactory<
  "{{dbxConfig.base}}:{{name}}",
  import("{{dbxConfig.base}}:{{name}}").RecordT,
  import("{{dbxConfig.base}}:{{name}}").InsertT,
  import("{{dbxConfig.base}}:{{name}}").UpdateT,
  import("{{dbxConfig.base}}:{{name}}").RecordT["{{primaryKey}}"]
>(
  apprilCrud$apprilDbx$Tables.{{declaredName}},
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
    zodErrorHandler: (e: any) => apprilCrud$fromZodError(e, { prefix: null, issueSeparator: ";\n" }),
  }
);

{{/tables}}

