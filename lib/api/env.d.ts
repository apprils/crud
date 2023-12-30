
declare module "@appril/crud/client" {
  import("../client/@types"); // mandatory for export types to work
  export * from "../client/@types";
}

declare module "@appril/crud/api" {
  import("./@types"); // mandatory for export types to work
  import { config } from import("./config");
  export { config };
  export * from "./@types";
}

