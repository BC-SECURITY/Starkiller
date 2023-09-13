<template>
  <v-tooltip top>
    <template #activator="{ on }">
      <span v-on="on">{{ moment(timestamp).fromNow() }}</span>
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
