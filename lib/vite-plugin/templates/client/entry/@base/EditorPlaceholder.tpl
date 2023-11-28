
<script setup lang="ts">
{{BANNER}}

import { store } from "./base";

</script>

<template>

<div class="d-flex justify-content-center">
  <h2>
    Total Items:
    {{=[[ ]]=}}
    {{ store.pager.totalItems }}
    [[={{ }}=]]
  </h2>
</div>

</template>

