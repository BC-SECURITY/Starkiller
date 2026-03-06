<template>
  <v-tooltip location="top">
    <template #activator="{ props: activatorProps }">
      <span v-bind="activatorProps">{{ moment(timestamp).fromNow() }}</span>
    </template>
    <span>{{ moment(timestamp).format("MMM D YYYY, h:mm:ss a") }}</span>
  </v-tooltip>
</template>

<script>
import moment from "moment";

export default {
  name: "DateTimeDisplay",
  props: {
    timestamp: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      moment,
    };
  },
};
</script>

<style></style>
