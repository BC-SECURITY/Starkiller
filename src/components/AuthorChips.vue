<template>
  <div>
    <template v-for="(author, index) in authors" :key="index">
      <a
        v-if="author.link"
        :href="author.link"
        target="_blank"
        rel="noopener noreferrer"
        class="chip-link"
      >
        <v-chip medium class="mr-1 mb-1">
          {{ formatDisplayName(author) }}
        </v-chip>
      </a>

      <v-chip v-else medium class="mr-1 mb-1">
        {{ formatDisplayName(author) }}
      </v-chip>
    </template>
  </div>
</template>

<script>
export default {
  name: "AuthorChips",
  props: {
    authors: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    formatDisplayName(author) {
      if (author.name && author.handle) {
        return `${author.name} (${author.handle})`;
      }
      if (author.name) {
        return author.name;
      }
      if (author.handle) {
        return author.handle;
      }
      return "";
    },
  },
};
</script>

<style lang="scss" scoped>
.chip-link {
  text-decoration: none;
}
</style>
