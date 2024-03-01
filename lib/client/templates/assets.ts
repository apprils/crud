// placeholder file, to be replaced with real values on module build

import type { ZodTypeAny } from "zod";
import { ApiTypesLiteral } from "../@types";

export type ItemT = unknown;
export type ItemI = unknown;
export type ItemU = unknown;

export type EnvT = unknown;
export type ListAssetsT = unknown;
export type ItemAssetsT = unknown;

export const primaryKey = "";
export const modelName: string = "";

export const apiBase: string = "";
export const apiTypes: ApiTypesLiteral = {
  EnvT: false,
  ListAssetsT: false,
  ItemAssetsT: false,
};

export const regularColumns: (keyof ItemT)[] = [];

export const zodSchema: Record<string, ZodTypeAny> = {};
export const zodErrorHandler: () => void = () => {};
