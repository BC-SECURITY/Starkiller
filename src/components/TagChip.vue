<template>
  <v-chip
    :color="chipColor"
    class="mt-1 mr-1 ml-1 mb-1"
    :style="{ color: textColor }"
    variant="flat"
    size="small"
    :closable="closable"
    @click:close="$emit('detach-tag', tag)"
  >
    {{ tag.name }}
  </v-chip>
</template>

<script>
import { readableTextColor } from "@/utils/contrast";

export default {
  name: "TagChip",
  props: {
    tag: {
      type: Object,
      required: true,
    },
    closable: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["detach-tag"],
  computed: {
    // Fall back to the material blue default for colorless quick-add tags.
    chipColor() {
      return this.tag.color || "#2196F3";
    },
    // variant="flat" doesn't auto-contrast its own text, so derive a readable
    // color from the chip background — otherwise pale tags render white-on-light.
    textColor() {
      return readableTextColor(this.chipColor);
    },
  },
};
</script>

<style></style>
