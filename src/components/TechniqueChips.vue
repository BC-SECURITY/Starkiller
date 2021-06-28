<template>
  <div
    v-if="techniques.length > 0"
    class="flex flex-row flex-wrap mb-2"
  >
    <span
      v-if="showTitle"
      class="mr-2"
    >Techniques:</span>
    <v-chip
      v-for="tech in techniques.filter(t => t !== '')"
      :key="tech"
      small
      :href="`https://attack.mitre.org/techniques/${tech}`"
      target="_blank"
      color="green"
      class="mr-1 mb-1"
    >
      {{ tech }}
    </v-chip>
  </div>
</template>

<script>
export default {
  name: 'TechniqueChips',
  props: {
    techniques: {
      type: Array,
      default: () => [],
    },
    showTitle: {
      type: Boolean,
      default: true,
    },
  },
};
</script>

<style>

</style>
