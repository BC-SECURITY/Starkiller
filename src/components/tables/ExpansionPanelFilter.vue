<template>
  <v-expansion-panel>
    <v-expansion-panel-header expand-icon="mdi-menu-down">
      {{ title }}
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-checkbox v-model="selectedAll" x-small dense label="Select All" />
      <v-divider class="pb-4" />
      <v-checkbox
        v-for="item in items"
        :key="item[itemKey]"
        v-model="selectedItems"
        :value="item[itemValue]"
        x-small
        dense
        :label="item[label]"
      />
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
export default {
  name: "ExpansionPanelFilter",
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    title: {
      type: String,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
    itemValue: {
      type: String,
      required: true,
    },
    itemKey: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    emptyDefault: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selectedItems: [],
    };
  },
  computed: {
    selectedAll: {
      set(val) {
        if (val) {
          this.selectedItems = this.items.map((a) => a[this.itemValue]);
        } else {
          this.selectedItems = [];
        }
      },
      get() {
        return this.selectedItems.length === this.items.length;
      },
    },
  },
  watch: {
    selectedItems: {
      handler(val) {
        this.$emit("input", val);
      },
    },
    items: {
      handler(val) {
        if (this.emptyDefault) {
          this.selectedItems = [];
        } else {
          this.selectedItems = val.map((a) => a[this.itemValue]);
        }
      },
    },
  },
  mounted() {
    if (this.emptyDefault) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.items.map((a) => a[this.itemValue]);
    }
  },
};
</script>

<style></style>
