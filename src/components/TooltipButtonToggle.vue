<template>
  <v-tooltip bottom>
    <template #activator="{ on }">
      <v-btn-toggle
        v-model="internalValue"
        class="mr-5"
      >
        <v-btn
          :value="true"
          v-on="on"
        >
          <v-icon left>
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
  name: 'TooltipButtonToggle',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      required: true,
    },
    buttonText: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      internalValue: false,
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.internalValue = newValue;
      },
    },
    internalValue: {
      handler(newValue) {
        this.$emit('input', newValue);
      },
    },
  },
};
</script>

<style>

</style>
