<template>
  <v-tooltip location="bottom">
    <template #activator="{ props: activatorProps }">
      <v-btn-toggle v-model="internalValue" class="mr-5">
        <v-btn :value="true" v-bind="activatorProps">
          <v-icon start>
            {{ icon }}
          </v-icon>
          <span>{{ buttonText }}</span>
        </v-btn>
      </v-btn-toggle>
    </template>
    <span>{{ text }}</span>
  </v-tooltip>
</template>

<script>
export default {
  name: "TooltipButtonToggle",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      required: true,
    },
    buttonText: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      internalValue: false,
    };
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(newValue) {
        this.internalValue = newValue;
      },
    },
    internalValue: {
      handler(newValue) {
        this.$emit("update:modelValue", !!newValue);
      },
    },
  },
};
</script>

<style></style>
