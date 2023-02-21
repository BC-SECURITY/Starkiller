<template>
  <portal to="app-bar">
    <div
      class="v-toolbar__content"
      style="width:100%"
    >
      <v-breadcrumbs :items="breads" />
      <v-spacer />
      <slot name="extra-stuff" />
      <v-btn
        v-if="showDelete && !smallDelete"
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
      <tooltip-button
        v-else-if="showDelete && smallDelete"
        icon="fa-trash-alt"
        color="error"
        :text="deleteText"
        @click="$emit('delete')"
      />
      <v-btn
        v-if="showCopy && Object.keys(copyLink).length > 0 && !smallCopy"
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
      <tooltip-button
        v-else-if="showCopy && Object.keys(copyLink).length > 0 && smallCopy"
        icon="fa-copy"
        :text="copyText"
        :to="copyLink"
      />
      <v-btn
        v-if="showSubmit"
        :disabled="disableSubmit"
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
import TooltipButton from '@/components/TooltipButton.vue';

export default {
  name: 'ListPageTop',
  components: { TooltipButton },
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
    disableSubmit: {
      type: Boolean,
    },
    submitLoading: {
      type: Boolean,
      default: false,
    },
    copyLink: {
      type: Object,
      default: () => {},
    },
    smallCopy: {
      type: Boolean,
      default: false,
    },
    smallDelete: {
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
