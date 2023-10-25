
<script setup lang="ts">
{{BANNER}}

import { ref } from "vue";
import { Icon, Confirm } from "@appril/ui";

import { store, modelName, useHandlers } from "./base";

const { deleteItem, itemDeleted, closeItem } = useHandlers()

const deleteItemId = ref<null | string>(null)

</script>

<template>

<Confirm v-model="deleteItemId" @on-confirm="() => deleteItem().then(itemDeleted)">
  You are about to
  <b class="text-danger">DELETE</b>
  {{=[[ ]]=}}
  {{ modelName }} #{{ deleteItemId }}!
  [[={{ }}=]]
</Confirm>

<div class="d-flex gap-2" style="position: fixed; top: 12px; right: 20px; z-index: 1030;">

  <slot name="createButton">
    <button type="button" @click="store.createDialog = true" class="btn btn-sm btn-outline-primary">
      <Icon plus />
    </button>
  </slot>

  <slot name="deleteButton">
    <button v-if="store.item" type="button" class="btn btn-sm btn-outline-danger"
      @click="deleteItemId = String(store.item.{{primaryKey}})">
      <Icon trash />
    </button>
  </slot>

  <slot name="closeButton">
    <button v-if="store.item" type="button" @click="closeItem"
      class="btn btn-sm btn-outline-secondary">
      <Icon compress />
    </button>
  </slot>

</div>

</template>

