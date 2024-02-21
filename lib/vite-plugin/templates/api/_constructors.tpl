{{BANNER}}

{{factoryCode}}

{{#tables}}
import { {{declaredName}} as ${{basename}} } from "{{sourceFolder}}/../{{dbxConfig.base}}/{{schema}}";
export const {{basename}} = $crudHandlersFactory<
  "{{dbxConfig.base}}:{{name}}",
  import("{{dbxConfig.base}}:{{name}}").RecordT,
  import("{{dbxConfig.base}}:{{name}}").InsertT,
  import("{{dbxConfig.base}}:{{name}}").UpdateT,
  import("{{dbxConfig.base}}:{{name}}").RecordT["{{primaryKey}}"]
>(
  ${{basename}},
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
  },
);

{{/tables}}

