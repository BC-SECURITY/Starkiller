<template>
  <v-dialog
    :model-value="modelValue"
    width="480"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>Add tags</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="query"
          label="Filter tags"
          variant="outlined"
          density="compact"
          autofocus
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          class="mb-2"
          @keyup.enter="onEnter"
        />

        <div v-if="loading" class="py-4 text-center">
          <v-progress-circular indeterminate size="24" />
        </div>
        <div v-else-if="error" class="py-4 text-center text-error">
          Failed to load tags.
        </div>
        <v-list
          v-else
          density="compact"
          max-height="320"
          class="overflow-y-auto"
        >
          <v-list-item
            v-for="tag in filtered"
            :key="tag.id"
            :active="isAttached(tag)"
            @click="toggle(tag)"
          >
            <template #prepend>
              <v-icon
                :icon="isAttached(tag) ? 'mdi-check' : 'mdi-blank'"
                size="small"
              />
              <v-icon
                icon="mdi-circle"
                size="x-small"
                :color="tag.color || '#2196F3'"
                class="ml-1 mr-2"
              />
            </template>
            <v-list-item-title>{{ tag.name }}</v-list-item-title>
            <v-list-item-subtitle v-if="tag.description">
              {{ tag.description }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item v-if="showCreate" key="__create__" @click="create">
            <template #prepend>
              <v-icon icon="mdi-plus" size="small" class="mr-2" />
            </template>
            <v-list-item-title>Create "{{ trimmedQuery }}"</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="!filtered.length && !showCreate">
            <v-list-item-title class="text-medium-emphasis">
              No tags found.
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="text" @click="goManage">Manage tags</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { filterTags, hasExactMatch } from "@/components/tags/tagPicker";

export default {
  name: "TagPickerDialog",
  props: {
    modelValue: { type: Boolean, default: false },
    tags: { type: Array, default: () => [] },
    registry: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    error: { type: Boolean, default: false },
  },
  emits: ["update:modelValue", "attach", "detach", "create"],
  data() {
    return { query: "" };
  },
  computed: {
    trimmedQuery() {
      return (this.query || "").trim();
    },
    filtered() {
      return filterTags(this.registry, this.query);
    },
    showCreate() {
      return (
        this.trimmedQuery.length > 0 &&
        !hasExactMatch(this.registry, this.trimmedQuery)
      );
    },
  },
  watch: {
    // Reset the filter each time the dialog opens.
    modelValue(open) {
      if (open) this.query = "";
    },
  },
  methods: {
    isAttached(tag) {
      return this.tags.some((t) => t.id === tag.id);
    },
    toggle(tag) {
      if (this.isAttached(tag)) this.$emit("detach", tag);
      else this.$emit("attach", tag.id);
    },
    create() {
      this.$emit("create", this.trimmedQuery);
      // Clear the filter so the full list returns for the next add.
      this.query = "";
    },
    onEnter() {
      if (this.showCreate) {
        this.create();
        return;
      }
      // Only act on a real query: attach the exact-name match if there is one,
      // else the sole filtered row. A blank filter does nothing.
      if (!this.trimmedQuery) return;
      const q = this.trimmedQuery.toLowerCase();
      const target =
        this.registry.find((t) => t.name.toLowerCase() === q) ||
        (this.filtered.length === 1 ? this.filtered[0] : null);
      if (target) this.toggle(target);
    },
    goManage() {
      this.$emit("update:modelValue", false);
      this.$router.push({ name: "tags" });
    },
  },
};
</script>
