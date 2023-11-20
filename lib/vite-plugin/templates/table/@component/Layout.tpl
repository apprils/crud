
<script setup lang="ts">
{{BANNER}}

import { ref, onBeforeMount } from "vue";
import { useRoute, onBeforeRouteUpdate } from "vue-router";
import { Success, Error } from "@appril/ui";

import { store } from "./base";
import { useHandlers } from "./handlers";

import ControlButtons from "./ControlButtons.vue";
import Pager from "./Pager.vue";
import EditorPlaceholder from "./EditorPlaceholder.vue";
import Overlay from "{{crudDir}}/Overlay.vue";

const props = defineProps<{
  fullpageEditor?: boolean;
}>()

const route = useRoute()

const error = ref()

const {
  itemRoute, itemKey, isActiveItem,
  loadEnv, envLoaded,
  loadItems, itemsLoaded,
  loadItem, itemLoaded,
} = useHandlers({
  errorHandler(e) { error.value = e },
})

onBeforeMount(() => {
  loadEnv().then(envLoaded).then(() => {
    loadItems().then(itemsLoaded).then(() => {
      if (route.query._id) {
        loadItem(route.query._id as string).then(itemLoaded)
      }
    })
  })
})

onBeforeRouteUpdate((to, from) => {

  if (to.query._page != from.query._page) {
    loadItems(to.query).then(itemsLoaded)
  }

  if (to.query._id && to.query._id != from.query._id) {
    loadItem(to.query._id as string).then(itemLoaded)
  }

})

</script>

<template>

<Success v-model="store.itemEvent.event">
  {{modelName}}
  {{=[[ ]]=}}
  #{{ store.itemEvent.id }} Successfully {{ store.itemEvent.event }}
  [[={{ }}=]]
</Success>

<Error v-model="error" />

<slot name="controlButtons">
  <ControlButtons>

    <slot name="createButton">
      <template slot="createButton"></template>
    </slot>

    <slot name="deleteButton">
      <template slot="deleteButton"></template>
    </slot>

    <slot name="closeButton">
      <template slot="closeButton"></template>
    </slot>

  </ControlButtons>
</slot>

<slot name="container">

  <div v-if="props.fullpageEditor">
    <slot v-if="store.item" :item="store.item"
      :key="itemKey(store.item, 'editor')" />
    <slot v-else name="editorPlaceholder">
      <EditorPlaceholder />
    </slot>
  </div>

  <div v-else class="row">
    <div class="col-lg-3">

      <div class="d-grid gap-2">

        <slot name="filters" />

        <div>

          <slot name="pager">
            <Pager />
          </slot>

        </div>

        <slot name="listHeader" />

        <slot name="list">
          <ul class="list-group shadow-sm">

            <li v-for="item of store.items" :key="itemKey(item, 'list')"
              class="list-group-item list-group-item-compact"
              :class="{ 'list-group-item-primary': isActiveItem(item) }"
              style="position: relative; min-height: 24px;">

              <slot name="listItem" :item="item">

                <slot name="listItemName" :item="item">
                  <slot name="listItemNamePrefix" :item="item" />
                  <slot name="listItemNameLink" :item="item">
                    <RouterLink :to="itemRoute(item)">
                      <slot name="listItemNameText" :item="item">
                        {{=[[ ]]=}}
                        {{ "name" in item ? item.name : "" }}
                        [[={{ }}=]]
                      </slot>
                    </RouterLink>
                  </slot>
                  <slot name="listItemNameSuffix" :item="item" />
                </slot>

                <slot name="listItemId" :item="item">
                  <div style="position: absolute; top: 0; right: 3px; font-size: .7rem;">
                    <slot name="listItemIdLink" :item="item">
                      <RouterLink :to="itemRoute(item)" class="text-muted">
                        <slot name="listItemIdText" :item="item">
                          {{=[[ ]]=}}
                          #{{
                          [[={{ }}=]]
                            item.{{primaryKey}}
                          {{=[[ ]]=}}
                          }}
                          [[={{ }}=]]
                        </slot>
                      </RouterLink>
                    </slot>
                  </div>
                </slot>
              </slot>

            </li>
          </ul>
        </slot>

        <slot name="listFooter" />

        <hr class="d-lg-none mt-0">

      </div>

    </div>

    <div class="col-lg-9">
      <slot v-if="store.item" name="editor" :item="store.item"
        :key="itemKey(store.item, 'editor')" />
      <slot v-else name="editorPlaceholder">
        <EditorPlaceholder />
      </slot>
    </div>

  </div>

</slot>

<slot v-if="store.loading" name="overlay">
  <Overlay />
</slot>

</template>

