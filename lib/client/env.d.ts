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

declare module "@appril/crud:storeFactory" {
  export { default } from "./templates/storeFactory";
}

declare module "@appril/crud:handlersFactory" {
  export { default } from "./templates/handlersFactory";
}

declare module "@crud:virtual-module-placeholder/assets" {
  import type { ApiTypesLiteral } from "@appril/crud/client";
  import type { ZodTypeAny } from "zod";

  export type ItemT = unknown;
  export type ItemI = unknown;
  export type ItemU = unknown;

  export type EnvT = unknown;
  export type ListAssetsT = unknown;
  export type ItemAssetsT = unknown;

  export const primaryKey: keyof ItemT = "";
  export const modelName: string = "";

  export const apiBase: string = "";
  export const apiTypes: ApiTypesLiteral = {};

  export const regularColumns: (keyof ItemT)[] = [];

  export const zodSchema: Record<string, ZodTypeAny> = {};
  export const zodErrorHandler: () => void = () => {};
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

  export const useStore: UseStore = () => {};
  export const actionListeners: unknown[] = [];
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

  type UseFilters = import("./@types").UseFilters<ItemT, ListAssetsT>;

  type UseModel = import("./@types").UseModel<ItemT>;

  export const useHandlers: UseHandlers = () => {};
  export const useFilters: UseFilters = () => {};
  export const useModel: UseModel = () => {};
}

declare module "@crud:virtual-module-placeholder/api" {
  import type { FetchMapper } from "@appril/more/fetch";
  export const api: FetchMapper = () => {};
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
  export {};
}
