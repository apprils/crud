{{BANNER}}

import { handlersFactory as $__handlersFactory__ } from "@appril/crud";

{{#tables}}
import { {{declaredName}} as ${{basename}} } from "{{sourceFolder}}/../{{dbxBase}}/{{schema}}";
export const {{basename}} = $__handlersFactory__<
  "{{dbxBase}}:{{name}}",
  import("{{dbxBase}}:{{name}}").RecordT,
  import("{{dbxBase}}:{{name}}").InsertT,
  import("{{dbxBase}}:{{name}}").UpdateT,
  import("{{dbxBase}}:{{name}}").RecordT["{{primaryKey}}"]
>(
  ${{basename}},
  {
    primaryKey: "{{primaryKey}}",
    columns: [
      {{#regularColumns}}
      "{{name}}",
      {{/regularColumns}}
    ],
    zodSchema(z) {
      return {
        {{#columns}}
        {{#zodSchema}}
        {{name}}: {{zodSchema}},
        {{/zodSchema}}
        {{/columns}}
      }
    },
  },
);

{{/tables}}

