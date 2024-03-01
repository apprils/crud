/// <reference path="../env.d.ts" />

import { storeFactory } from "@appril/crud/client";

import {
  type ItemT,
  type EnvT,
  type ListAssetsT,
  type ItemAssetsT,
  primaryKey,
  modelName,
} from "./assets";

const { useStore, actionListeners } = storeFactory<
  ItemT,
  EnvT,
  ListAssetsT,
  ItemAssetsT
>({
  modelName,
  primaryKey,
} as { modelName: string; primaryKey: keyof ItemT });

export { useStore, actionListeners };
