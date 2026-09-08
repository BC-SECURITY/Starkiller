<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="true"
      :show-refresh="true"
      :show-delete="false"
      @create="openCreate"
      @refresh="getTags"
    />
    <v-data-table :headers="headers" :items="tags" density="compact">
      <template #item.name="{ item }">
        <tag-chip :tag="item" :closable="false" />
      </template>
      <template #item.actions="{ item }">
        <div class="d-flex ga-1">
          <v-btn icon variant="text" size="small" @click="openEdit(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon variant="text" size="small" @click="remove(item)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </div>
      </template>
    </v-data-table>
    <tag-dialog v-model="dialog" :tag="editing" @save="save" />
  </div>
</template>

<script>
import * as tagApi from "@/api/tag-api";
import ListPageTop from "@/components/ListPageTop.vue";
import TagChip from "@/components/TagChip.vue";
import TagDialog from "@/components/tags/TagDialog.vue";
import { fetchAllTags } from "@/utils/tags";

export default {
  name: "Tags",
  components: { ListPageTop, TagChip, TagDialog },
  inject: ["snack", "confirm"],
  data() {
    return {
      tags: [],
      dialog: false,
      editing: null,
      saving: false,
      breads: [{ title: "Tags", disabled: true, href: "/tags" }],
      headers: [
        { title: "Name", key: "name" },
        { title: "Description", key: "description" },
        { title: "Usage", key: "usage_count" },
        { title: "Actions", key: "actions", sortable: false, width: 96 },
      ],
    };
  },
  mounted() {
    this.getTags();
  },
  methods: {
    async getTags() {
      try {
        this.tags = await fetchAllTags();
      } catch (err) {
        this.snack.error(`Error: ${err}`);
      }
    },
    openCreate() {
      this.editing = null;
      this.dialog = true;
    },
    openEdit(tag) {
      this.editing = tag;
      this.dialog = true;
    },
    async save(form) {
      // Guard against a double-submit (rapid Save clicks / Enter) firing two
      // create/update round-trips — the second would 409 and snack a spurious
      // error for what looks like one action.
      if (this.saving) return;
      this.saving = true;
      try {
        if (this.editing) {
          await tagApi.updateTag(this.editing.id, form);
        } else {
          await tagApi.createTag(form);
        }
        this.dialog = false;
        this.getTags();
      } catch (err) {
        this.snack.error(`Error: ${err}`);
      } finally {
        this.saving = false;
      }
    },
    async remove(tag) {
      const ok = await this.confirm(
        "Delete tag?",
        `Remove "${tag.name}" from ${tag.usage_count} ${
          tag.usage_count === 1 ? "entity" : "entities"
        } and delete it?`,
        { color: "red" },
      );
      if (!ok) return;
      try {
        await tagApi.deleteTag(tag.id);
        this.getTags();
      } catch (err) {
        this.snack.error(`Error: ${err}`);
      }
    },
  },
};
</script>
