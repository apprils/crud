
<script setup lang="ts">

import { store } from "@crud:virtual-module-placeholder/base";

</script>

<template>

<div class="d-flex justify-content-center">
  <h2>
    Total Items: {{ store.listPager.totalItems }}
  </h2>
</div>

</template>

