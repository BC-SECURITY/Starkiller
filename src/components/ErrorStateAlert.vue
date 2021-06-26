<template>
  <v-alert
    prominent
    type="error"
  >
    <v-row align="center">
      <v-col class="grow">
        {{ message }}
      </v-col>
      <v-col class="shrink">
        <v-btn @click="$router.go(-1)">
          Go back
        </v-btn>
      </v-col>
    </v-row>
  </v-alert>
</template>

<script>
export default {
  name: 'ErrorStateAlert',
  props: {
    resourceType: {
      type: String,
      required: true,
    },
    resourceId: {
      type: [String, Number],
      required: true,
    },
    message: {
      type: String,
      default: () => `The resource '${this.resourceType}/${this.resourceId}' Not Found.`,
    },
  },
};
</script>

<style>

</style>
