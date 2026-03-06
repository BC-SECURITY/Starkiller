<template>
  <v-expansion-panel>
    <v-expansion-panel-title expand-icon="mdi-menu-down">
      {{ title }}
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-checkbox
        v-model="selectedAll"
        color="primary"
        density="compact"
        label="Select All"
      />
      <v-divider class="pb-4" />
      <v-checkbox
        v-for="item in items"
        :key="item[itemKey]"
        v-model="selectedItems"
        :value="item[itemValue]"
        color="primary"
        density="compact"
        :label="item[label]"
      />
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script>
export default {
  name: "ExpansionPanelFilter",
  props: {
    modelValue: {
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
  emits: ["update:modelValue"],
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
        this.$emit("update:modelValue", val);
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
