<template>
  <v-tooltip location="top">
    <template #activator="{ props: activatorProps }">
      <span v-bind="activatorProps">{{ relativeTime }}</span>
    </template>
    <span>{{ absoluteTime }}</span>
  </v-tooltip>
</template>

<script>
import dayjs from "@/plugins/dayjs";

export default {
  name: "DateTimeDisplay",
  props: {
    timestamp: {
      type: String,
      required: true,
    },
  },
  computed: {
    // dayjs(null|"") is "valid" and yields a bogus relative time (moment
    // rendered "Invalid date"); guard so an unparseable timestamp shows a
    // placeholder. dayjs(undefined) stays valid (= now), matching moment.
    relativeTime() {
      const parsed = dayjs(this.timestamp);
      return parsed.isValid() ? parsed.fromNow() : "N/A";
    },
    absoluteTime() {
      const parsed = dayjs(this.timestamp);
      return parsed.isValid() ? parsed.format("MMM D YYYY, h:mm:ss a") : "N/A";
    },
  },
};
</script>

<style></style>
