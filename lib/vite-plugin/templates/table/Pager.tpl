
<script setup lang="ts">
{{BANNER}}

import { Icon } from "@appril/ui";

import { store, useHandlers } from "./base"

const { gotoPage } = useHandlers()

</script>

<template>

<div class="input-group input-group-sm">

  <button type="button" @click="gotoPage(1)"
    class="btn btn-outline-secondary" :disabled="store.pager.currentPage <= 1">
    <Icon angles-left />
  </button>

  <button type="button" @click="gotoPage(store.pager.prevPage)"
    class="btn btn-outline-secondary" :disabled="!store.pager.prevPage">
    {{=[[ ]]=}}
    <Icon angle-left /> {{ store.pager.prevPage }}
    [[={{ }}=]]
  </button>

  <input type="text" :value="store.pager.currentPage"
    @keyup.enter.prevent="gotoPage(($event.target as HTMLInputElement).value)"
    class="form-control text-center">

  <button type="button" @click="gotoPage(store.pager.nextPage)"
    class="btn btn-outline-secondary" :disabled="!store.pager.nextPage">
    {{=[[ ]]=}}
    {{ store.pager.nextPage }} <Icon angle-right />
    [[={{ }}=]]
  </button>

  <button type="button" @click="gotoPage(store.pager.totalPages)"
    class="btn btn-outline-secondary"
      :disabled="store.pager.currentPage >= store.pager.totalPages">
    <Icon angles-right />
  </button>

</div>

<div class="d-flex justify-content-center">
  <small v-if="store.pager.totalItems > 0" class="text-muted">
    {{=[[ ]]=}}
    {{ store.pager.offset + 1 }}
    - {{ store.pager.offset + store.items.length }}
    of {{ store.pager.totalItems }}
    [[={{ }}=]]
  </small>
</div>

</template>

