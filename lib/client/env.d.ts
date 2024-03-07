/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare module "@appril/crud/client" {
  import("./@types"); // mandatory for export types to work
  export * from "./@types";
}
