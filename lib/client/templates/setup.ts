import { store, actionListeners } from "./base";

for (const listener of actionListeners) {
  store.$onAction(listener);
}
