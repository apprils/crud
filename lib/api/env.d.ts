
declare module "@appril/crud/client" {
  export type Pager = any;
}

declare module "@appril/crud/api" {
  import("./@types"); // mandatory for export types to work
  import { config } from import("./config");
  export { config };
  export * from "./@types";
}

