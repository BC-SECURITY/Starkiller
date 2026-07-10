<template>
  <div class>
    <list-page-top
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
          label="name"
          item-key="id"
          item-value="name"
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
          @refresh-tags="getTags"
        />
      </template>
    </advanced-table>
  </div>
</template>

<script>
import ListPageTop from "@/components/ListPageTop.vue";
import ExpansionPanelFilter from "@/components/tables/ExpansionPanelFilter.vue";
import AdvancedTable from "@/components/tables/AdvancedTable.vue";
import ListenersTable from "@/components/listeners/ListenersTable.vue";
import { fetchTags } from "@/utils/tags";
import { useListenerStore } from "@/stores/listener-module";

export default {
  name: "Listeners",
  components: {
    AdvancedTable,
    ListenersTable,
    ExpansionPanelFilter,
    ListPageTop,
  },
  inject: ["confirm"],
  data() {
    return {
      breads: [
        {
          title: "Listeners",
          disabled: true,
          href: "/listeners",
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
      this.tags = await fetchTags("listener");
    },
    create() {
      this.$router.push({ name: "listenerNew" });
    },
    async killListener(item) {
      if (
        await this.confirm(
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
        await this.confirm(
          "Delete",
          `Are you sure you want to kill ${this.selected.length} listeners?`,
          { color: "red" },
        )
      ) {
        this.selected.forEach((id) => {
          this.listenerStore.killListener(id);
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
