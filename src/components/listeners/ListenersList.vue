<template>
  <div class>
    <list-page-top
      v-if="active"
      :breads="breads"
      :show-create="true"
      :show-refresh="true"
      :refresh-loading="listenersStatus === 'loading'"
      :show-delete="showDelete"
      @create="create"
      @delete="killListeners"
      @refresh="getListeners"
    />
    <advanced-table>
      <template #filters>
        <expansion-panel-filter
          v-model="selectedTags"
          title="Tags"
          label="label"
          item-key="id"
          item-value="label"
          :items="tags"
          :empty-default="true"
        />
      </template>
      <template #table>
        <listeners-table
          ref="listenersTable"
          v-model="selected"
          :selected-tags="selectedTags"
          @kill-listener="killListener"
        />
      </template>
    </advanced-table>
  </div>
</template>

<script>
import moment from "moment";
import ListPageTop from "@/components/ListPageTop.vue";
import ExpansionPanelFilter from "@/components/tables/ExpansionPanelFilter.vue";
import AdvancedTable from "@/components/tables/AdvancedTable.vue";
import ListenersTable from "@/components/listeners/ListenersTable.vue";
import * as tagApi from "@/api/tag-api";
import { useListenerStore } from "@/stores/listener-module";

export default {
  name: "Listeners",
  components: {
    AdvancedTable,
    ListenersTable,
    ExpansionPanelFilter,
    ListPageTop,
  },
  props: {
    active: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      moment,
      breads: [
        {
          text: "Listeners",
          disabled: true,
          href: "/listeners",
        },
        {
          text: "List",
          disabled: true,
          href: "/listeners?tab=list-view",
        },
      ],
      selected: [],
      tags: [],
      selectedTags: [],
    };
  },
  computed: {
    // mapStore breaks autocomplete
    listenerStore() {
      return useListenerStore();
    },
    listenersStatus() {
      return this.listenerStore.status;
    },
    showDelete() {
      return this.selected.length > 0;
    },
  },
  mounted() {
    this.getListeners();
    this.getTags();
  },
  methods: {
    async getTags() {
      const tags = await tagApi.getTags({
        page: 1,
        limit: -1,
        sources: "listener",
      });

      const dedupedTags = [];
      tags.records.forEach((tag) => {
        const existingTag = dedupedTags.find(
          (t) => t.name === tag.name && t.value === tag.value,
        );
        if (!existingTag) {
          dedupedTags.push(tag);
        }
      });

      this.tags = dedupedTags;
    },
    create() {
      this.$router.push({ name: "listenerNew" });
    },
    async killListener(item) {
      if (
        await this.$root.$confirm(
          "Delete",
          `Are you sure you want to kill listener ${item.name}?`,
          { color: "red" },
        )
      ) {
        await this.listenerStore.killListener(item.id);
      }
    },
    async killListeners() {
      if (
        await this.$root.$confirm(
          "Delete",
          `Are you sure you want to kill ${this.selected.length} listeners?`,
          { color: "red" },
        )
      ) {
        this.selected.forEach((listener) => {
          this.listenerStore.killListener(listener.id);
        });
        this.selected = [];
      }
    },
    getListeners() {
      this.$refs.listenersTable.getListeners();
    },
  },
};
</script>

<style></style>
