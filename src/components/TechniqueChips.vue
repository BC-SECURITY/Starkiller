<template>
  <div v-if="techniques.length > 0" class="flex flex-row flex-wrap mb-2">
    <span v-if="showTitle" class="mr-2">Techniques:</span>
    <v-chip
      v-for="tech in techniques.filter((t) => t !== '')"
      :key="tech"
      small
      :href="getTechniqueUrl(tech)"
      target="_blank"
      rel="noopener noreferrer"
      color="green"
      class="mr-1 mb-1"
    >
      {{ tech }}
    </v-chip>
  </div>
</template>

<script>
export default {
  name: "TechniqueChips",
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
  methods: {
    getTechniqueUrl(tech) {
      if (tech.includes(".")) {
        const [main, sub] = tech.split(".");
        return `https://attack.mitre.org/techniques/${main}/${sub}`;
      }
      return `https://attack.mitre.org/techniques/${tech}`;
    },
  },
};
</script>

<style></style>
