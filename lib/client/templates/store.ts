
import storeFactory from "@appril/crud:storeFactory";

import {
  type ItemT,
  type EnvT,
  type ListAssetsT,
  type ItemAssetsT,
  primaryKey, modelName,
} from "@crud:virtual-module-placeholder/assets";

const { useStore, actionListeners } = storeFactory<
  ItemT,
  EnvT,
  ListAssetsT,
  ItemAssetsT
>({
  modelName,
  primaryKey,
})

export { useStore, actionListeners }

