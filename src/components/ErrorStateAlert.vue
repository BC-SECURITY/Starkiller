<template>
  <v-alert
    prominent
    type="error"
  >
    <v-row align="center">
      <v-col class="grow">
        The resource '{{ resourceType }}/{{ resourceId }}' Not Found.
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
  },
};
</script>

<style>

</style>
