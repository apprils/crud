{{BANNER}}

{{#tables}}
import * as {{basename}} from "./{{basename}}";
{{/tables}}

{{#tables}}
export { {{basename}} };
{{/tables}}

export default {
{{#tables}}
  {{basename}},
{{/tables}}
}

