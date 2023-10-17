<template>
  <v-expansion-panel>
    <v-expansion-panel-header expand-icon="mdi-menu-down">
      {{ title }}
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-text-field
        v-model="internalValue"
        :label="label"
        outlined
        dense
        required
      />
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
export default {
  name: "ExpansionPanelSearch",
  props: {
    value: {
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
  data() {
    return {
      internalValue: "",
    };
  },
  watch: {
    internalValue: {
      handler(val) {
        this.$emit("input", val);
      },
    },
  },
  mounted() {
    this.internalValue = this.value;
  },
};
</script>

<style></style>
