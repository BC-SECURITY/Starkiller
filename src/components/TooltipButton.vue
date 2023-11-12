<template>
  <v-tooltip bottom>
    <template #activator="{ on }">
      <v-btn
        :color="flat ? '' : color"
        :to="to"
        :disabled="disabled"
        class="mr-5"
        icon
        :small="!xSmall"
        :x-small="xSmall"
        v-on="on"
        @click="$emit('click')"
      >
        <v-icon :style="padLeft !== 0 ? `padding-left: ${padLeft}px` : ''">
          {{ icon }} {{ rotate ? "fa-spin" : "" }}
        </v-icon>
      </v-btn>
    </template>
    <span>{{ text }}</span>
  </v-tooltip>
</template>

<script>
export default {
  name: "TooltipButton",
  props: {
    icon: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    padLeft: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "",
    },
    flat: {
      type: Boolean,
      default: false,
    },
    to: {
      type: Object,
      default: null,
    },
    xSmall: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    rotate: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    style() {
      return this.padLeft !== 0 ? `padding-left: ${this.padLeft}px` : "";
    },
  },
};
</script>

<style></style>
