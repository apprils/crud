
/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module "@appril/crud/client" {
  import("./@types"); // mandatory for export types to work
  export * from "./@types";
}

declare module "@appril/crud:storeFactory" {
  export { default } from import("./templates/storeFactory");
}

declare module "@appril/crud:handlersFactory" {
  export { default } from import("./templates/handlersFactory");
}

declare module "@crud:virtual-module-placeholder/assets" {

  import type { ApiTypesLiteral } from "@appril/crud/client";
  import type { ZodTypeAny } from "zod";

  export type ItemT = any;
  export type ItemI = any;
  export type ItemU = any;

  export type EnvT = any;
  export type ListAssetsT = any;
  export type ItemAssetsT = any;

  export const primaryKey: keyof ItemT = "";
  export const modelName: string = "";

  export const apiBase: string = "";
  export const apiTypes: ApiTypesLiteral = {};

  export const regularColumns: (keyof ItemT)[] = [];

  export const zodSchema: Record<string, ZodTypeAny> = {};
  export const zodErrorHandler: Function = function() {};

}

declare module "@crud:virtual-module-placeholder/store" {

  import type {
    ItemT,
    EnvT,
    ListAssetsT,
    ItemAssetsT,
  } from "@crud:virtual-module-placeholder/assets";

  type UseStore = import("./@types").UseStore<
    "generic",
    ItemT,
    EnvT,
    ListAssetsT,
    ItemAssetsT
  >;

  export const useStore: UseStore = function() {};
  export const actionListeners: any[] = []

}

declare module "@crud:virtual-module-placeholder/handlers" {

  import type {
    ItemT,
    ItemI,
    ItemU,
    EnvT,
    ListAssetsT,
    ItemAssetsT,
  } from "@crud:virtual-module-placeholder/assets";

  type UseHandlers = import("./@types").UseHandlers<
    ItemT,
    ItemI,
    ItemU,
    EnvT,
    ListAssetsT,
    ItemAssetsT
  >;

  type UseModel = import("./@types").UseModel<ItemT>;

  export const useHandlers: UseHandlers = function() {};

  export const useModel: UseModel = function() {};

}

declare module "@crud:virtual-module-placeholder/api" {

  import type { FetchMapper } from "@appril/more/fetch";
  export const api: FetchMapper = function() {};

}

declare module "@crud:virtual-module-placeholder/base" {

  import { useStore } from "@crud:virtual-module-placeholder/store";

  export * from "@crud:virtual-module-placeholder/assets";
  export * from "@crud:virtual-module-placeholder/store";
  export * from "@crud:virtual-module-placeholder/handlers";
  export * from "@crud:virtual-module-placeholder/api";

  export const store: ReturnType<typeof useStore> = {};

}

declare module "@crud:virtual-module-placeholder/setup" {
  export {}
}

