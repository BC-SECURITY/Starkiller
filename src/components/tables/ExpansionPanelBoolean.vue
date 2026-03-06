<template>
  <expansion-panel-filter
    v-model="selectedItems"
    :title="title"
    label="label"
    item-key="value"
    item-value="value"
    :items="items"
    :empty-default="emptyDefault"
  />
</template>

<script>
import ExpansionPanelFilter from "@/components/tables/ExpansionPanelFilter.vue";

export default {
  name: "ExpansionPanelBoolean",
  components: {
    ExpansionPanelFilter,
  },
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    title: {
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
      items: [
        { value: true, label: "True" },
        { value: false, label: "False" },
      ],
    };
  },
  watch: {
    selectedItems: {
      handler(val) {
        this.$emit("update:modelValue", val);
      },
    },
  },
};
</script>

<style></style>
