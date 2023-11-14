
<script setup lang="ts">
{{BANNER}}

import { ref } from "vue";
import { IconOrSpinner, Error } from "@appril/ui";

import type { ItemT, ItemI } from "./types";
import { store } from "./base";
import { useHandlers } from "./handlers";

const { createItem, itemCreated } = useHandlers()

const props = defineProps<{
  modelValue: ItemI;
}>()

const emit = defineEmits<{
  mounted: [];
  created: [item: ItemT];
  close: [];
}>()

const creating = ref(false)
const error = ref(null)

function create() {
  creating.value = true
  return createItem(props.modelValue)
    .then(itemCreated)
    .then((item) => emit("created", item))
    .then(close)
    .catch((e: any) => error.value = e.message)
    .finally(() => creating.value = false)
}

function close() {
  emit("close")
  store.createDialog = false
}

</script>

<template>

<Error v-model="error" />

<Modal @mounted="$emit('mounted')" @close="close">

  <template #header.fw-semibold.fst-italic>
    <slot name="header" :create="create">
      New {{modelName}}
    </slot>
  </template>

  <template #body.d-grid.gap-3>
    <slot :create="create" />
  </template>

  <template #footer>
    <slot name="footer" :create="create">
      <button type="button" @click="create" class="btn btn-primary">
        <IconOrSpinner plus :spin="creating" />
        Create
      </button>
    </slot>
  </template>

</Modal>

</template>

