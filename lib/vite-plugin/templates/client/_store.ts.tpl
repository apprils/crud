
import storeFactory from "@appril/crud:storeFactory";

import {
  type ItemT,
  type ItemAssetsT,
  type EnvT,
  primaryKey, modelName,
} from "@crud:virtual-module-placeholder/assets";

const { useStore, actionListeners } = storeFactory<
  ItemT,
  ItemAssetsT,
  EnvT
>({
  modelName,
  primaryKey,
})

export { useStore, actionListeners }

