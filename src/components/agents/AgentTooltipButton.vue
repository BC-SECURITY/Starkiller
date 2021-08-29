<template>
  <v-tooltip
    bottom
  >
    <template #activator="{ on }">
      <v-btn
        :color="flat ? '' : color"
        class="mr-5"
        icon
        small
        v-on="on"
        @click="$emit('click')"
      >
        <v-icon
          :style="padLeft !== 0 ? `padding-left: ${padLeft}px` : ''"
        >
          {{ icon }}
        </v-icon>
      </v-btn>
    </template>
    <span>{{ text }}</span>
  </v-tooltip>
</template>

<script>
export default {
  name: 'AgentTooltipButton',
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
      default: '',
    },
    flat: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style>

</style>
