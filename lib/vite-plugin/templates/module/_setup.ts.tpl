
import { store } from "@crud:virtual-module-placeholder/base";
import storeModule from "@crud:virtual-module-placeholder/store";

const actionListeners = [
  ...storeModule.actionListeners,
]

for (const listener of actionListeners) {
  store.$onAction(listener)
}

