<template>
  <div style="display: flex; flex-direction: row; flex-wrap: wrap">
    <v-card class="mr-2 pa-2" elevation="2" outlined style="flex-basis: 250px">
      <v-expansion-panels class="mb-6" multiple>
        <slot name="filters" />
      </v-expansion-panels>
    </v-card>
    <v-card style="flex: 1; min-width: 0" elevation="2" outlined>
      <slot name="table" />
    </v-card>
  </div>
</template>

<script>
export default {
  name: "AdvancedTable",
};
</script>

<style></style>
