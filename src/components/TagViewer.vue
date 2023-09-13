<template>
  <div style="display: flex; flex-direction: row-reverse">
    <div>
      <tag-chip
        v-for="tag in tags"
        :key="tag.id"
        :tag="tag"
        @delete-tag="deleteTag"
        @update-tag="updateTag"
      />
    </div>
    <div>
      <tag-chip
        :is-new="true"
        :close="false"
        custom-icon="mdi-plus-circle"
        @update-tag="newTag"
      />
    </div>
  </div>
</template>

<script>
import TagChip from "@/components/TagChip.vue";

export default {
  name: "TagViewer",
  components: {
    TagChip,
  },
  props: {
    tags: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      menu: {},
    };
  },
  methods: {
    deleteTag(tag) {
      this.$emit("delete-tag", tag);
    },
    updateTag(tag) {
      this.$emit("update-tag", tag);
    },
    newTag(tag) {
      this.$emit("new-tag", tag);
    },
  },
};
</script>

<style></style>
