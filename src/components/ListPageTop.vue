<template>
  <portal to="app-bar">
    <div class="v-toolbar__content pt-2" style="width: 100%">
      <v-breadcrumbs :items="breads" />
      <v-spacer />
      <div class="pt-2">
        <slot name="extra-stuff" />
      </div>
      <div>
        <v-btn
          v-if="showDelete"
          color="error"
          text
          class="mr-2"
          @click="$emit('delete')"
        >
          {{ deleteText }}
          <v-icon right> fa-trash-alt </v-icon>
        </v-btn>
        <v-btn
          v-if="showRefresh && !isAutoRefresh"
          :disabled="refreshLoading"
          color="primary"
          text
          class="mr-2"
          @click="$emit('refresh')"
        >
          {{ refreshText }}
          <v-icon right> fa-redo {{ refreshLoading ? "fa-spin" : "" }} </v-icon>
        </v-btn>
        <tooltip-button-toggle
          v-if="showRefresh && isAutoRefresh"
          v-model="autoRefreshInternal"
          icon="fa-redo"
          :button-text="autoRefreshInternal ? 'On' : 'Off'"
          :text="refreshText"
        />
        <v-btn
          v-if="showCreate"
          color="primary"
          class="mr-2"
          rounded
          @click="$emit('create')"
        >
          {{ createText }}
          <v-icon right> fa-plus-square </v-icon>
        </v-btn>
      </div>
    </div>
  </portal>
</template>

<script>
import TooltipButtonToggle from "@/components/TooltipButtonToggle.vue";

export default {
  name: "ListPageTop",
  components: { TooltipButtonToggle },
  props: {
    deleteText: {
      type: String,
      default: "Delete",
    },
    refreshText: {
      type: String,
      default: "Refresh",
    },
    createText: {
      type: String,
      default: "Create",
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
    refreshLoading: {
      type: Boolean,
      default: false,
    },
    // Whether the refresh button is a toggle or not
    isAutoRefresh: {
      type: Boolean,
      default: false,
    },
    // Whether the auto refresh is on or off
    autoRefresh: {
      type: Boolean,
      default: false,
    },
    breads: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      autoRefreshInternal: false,
    };
  },
  watch: {
    autoRefresh: {
      immediate: true,
      handler(newValue) {
        this.autoRefreshInternal = newValue;
      },
    },
    autoRefreshInternal: {
      handler(newValue) {
        this.$emit("update:auto-refresh", newValue);
      },
    },
  },
};
</script>

<style></style>
