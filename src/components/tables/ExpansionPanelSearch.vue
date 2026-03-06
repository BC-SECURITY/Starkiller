<template>
  <v-expansion-panel>
    <v-expansion-panel-title expand-icon="mdi-menu-down">
      {{ title }}
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-text-field
        v-model="internalValue"
        :label="label"
        variant="outlined"
        density="compact"
        required
      />
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script>
export default {
  name: "ExpansionPanelSearch",
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      internalValue: "",
    };
  },
  watch: {
    internalValue: {
      handler(val) {
        this.$emit("update:modelValue", val);
      },
    },
  },
  mounted() {
    this.internalValue = this.modelValue;
  },
};
</script>

<style></style>
