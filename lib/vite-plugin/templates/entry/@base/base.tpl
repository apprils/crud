{{BANNER}}

import { fetch } from "@appril/more/fetch";

import { useStore, actionListeners } from "./store";

export const modelName = "{{modelName}}"

export const store = useStore()

for (const listener of actionListeners) {
  store.$onAction(listener)
}

export const api = fetch("{{apiBase}}")

