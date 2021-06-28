<template>
  <portal to="app-bar">
    <div
      class="v-toolbar__content"
      style="width:100%"
    >
      <v-breadcrumbs :items="breads" />
      <v-spacer />
      <slot name="extra-stuff" />
      <div>
        <v-btn
          v-if="showDelete"
          color="error"
          text
          class="mr-2"
          @click="$emit('delete')"
        >
          {{ deleteText }}
          <v-icon
            right
          >
            fa-trash-alt
          </v-icon>
        </v-btn>
        <v-btn
          v-if="showRefresh"
          color="primary"
          text
          class="mr-2"
          @click="$emit('refresh')"
        >
          {{ refreshText }}
          <v-icon
            right
          >
            fa-redo
          </v-icon>
        </v-btn>
        <v-btn
          v-if="showCreate"
          color="primary"
          class="mr-2"
          rounded
          @click="$emit('create')"
        >
          {{ createText }}
          <v-icon
            right
          >
            fa-plus-square
          </v-icon>
        </v-btn>
      </div>
    </div>
  </portal>
</template>

<script>
export default {
  name: 'ListPageTop',
  props: {
    deleteText: {
      type: String,
      default: 'Delete',
    },
    refreshText: {
      type: String,
      default: 'Refresh',
    },
    createText: {
      type: String,
      default: 'Create',
    },
    showDelete: {
      type: Boolean,
      default: false,
    },
    showRefresh: {
      type: Boolean,
      default: false,
    },
    showCreate: {
      type: Boolean,
      default: false,
    },
    breads: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style>

</style>
