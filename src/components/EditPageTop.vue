<template>
  <portal to="app-bar">
    <div
      class="v-toolbar__content"
      style="width:100%"
    >
      <v-breadcrumbs :items="breads" />
      <v-spacer />
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
        v-if="showCopy && Object.keys(copyLink).length > 0"
        color="primary"
        text
        class="mr-2"
        :to="copyLink"
      >
        {{ copyText }}
        <v-icon
          right
        >
          fa-copy
        </v-icon>
      </v-btn>
      <v-btn
        v-if="showSubmit"
        type="submit"
        class="primary"
        :loading="submitLoading"
        @click="$emit('submit')"
      >
        {{ submitText }}
      </v-btn>
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
    copyText: {
      type: String,
      default: 'Copy',
    },
    submitText: {
      type: String,
      default: 'Submit',
    },
    showDelete: {
      type: Boolean,
      default: false,
    },
    showCopy: {
      type: Boolean,
      default: false,
    },
    showSubmit: {
      type: Boolean,
      default: false,
    },
    submitLoading: {
      type: Boolean,
      default: false,
    },
    copyLink: {
      type: Object,
      default: () => {},
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
