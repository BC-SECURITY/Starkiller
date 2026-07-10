<template>
  <div style="display: flex; flex-wrap: wrap; align-items: center">
    <tag-chip
      v-for="tag in tags"
      :key="tag.id"
      :tag="tag"
      @detach-tag="detachTag"
    />
    <v-chip class="ma-1" size="small" variant="outlined" @click="openPicker">
      <v-icon :start="tags.length === 0" icon="mdi-plus" size="small" />
      <span v-if="tags.length === 0">Add tags</span>
    </v-chip>
    <tag-picker-dialog
      v-model="pickerOpen"
      :tags="tags"
      :registry="registry"
      :loading="registryLoading"
      :error="registryError"
      @attach="onAttach"
      @detach="detachTag"
      @create="onCreate"
    />
  </div>
</template>

<script>
import TagChip from "@/components/TagChip.vue";
import TagPickerDialog from "@/components/tags/TagPickerDialog.vue";
import { attachValueToTagId, fetchAllTags } from "@/utils/tags";

export default {
  name: "TagViewer",
  components: { TagChip, TagPickerDialog },
  inject: ["snack"],
  props: {
    tags: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["attach-tag", "detach-tag"],
  data() {
    return {
      pickerOpen: false,
      registry: [],
      registryLoaded: false,
      registryLoading: false,
      registryError: false,
    };
  },
  methods: {
    async openPicker() {
      this.pickerOpen = true;
      await this.loadRegistryOnce();
    },
    // Lazy: only fetch the registry when the operator first opens the picker.
    // Mark it loaded only on success so a failed fetch retries on the next open
    // instead of leaving the list permanently empty.
    async loadRegistryOnce() {
      if (this.registryLoaded || this.registryLoading) return;
      this.registryLoading = true;
      this.registryError = false;
      try {
        this.registry = await fetchAllTags();
        this.registryLoaded = true;
      } catch (error) {
        this.registryError = true;
        this.snack.error(`Error: ${error}`);
      } finally {
        this.registryLoading = false;
      }
    },
    detachTag(tag) {
      this.$emit("detach-tag", tag);
    },
    onAttach(tagId) {
      this.$emit("attach-tag", { tag_id: tagId });
    },
    async onCreate(name) {
      let tagId;
      try {
        // A brand-new name is created in the registry then attached by id.
        tagId = await attachValueToTagId(name);
      } catch (error) {
        this.snack.error(`Error: ${error}`);
        return;
      }
      if (tagId == null) return;
      this.$emit("attach-tag", { tag_id: tagId });
      // Refresh the registry silently (the dialog is open) so the new tag shows
      // checked. A refresh failure is non-fatal — the tag is already attached.
      try {
        this.registry = await fetchAllTags();
        this.registryLoaded = true;
      } catch (error) {
        this.snack.error(`Error refreshing tags: ${error}`);
      }
    },
  },
};
</script>

<style></style>
