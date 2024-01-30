import { store, actionListeners } from "@crud:virtual-module-placeholder/base";

for (const listener of actionListeners) {
  store.$onAction(listener);
}
