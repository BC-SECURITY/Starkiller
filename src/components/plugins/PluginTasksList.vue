<template>
  <div>
    <list-page-top
      v-if="active"
      :breads="breads"
      :show-create="false"
      :show-refresh="true"
      :show-delete="false"
      @refresh="getTasks"
    />
    <advanced-table>
      <template #filters>
        <expansion-panel-search
          v-model="search"
          title="Search"
          label="Search"
        />
        <expansion-panel-filter
          v-if="!plugin"
          v-model="selectedPlugins"
          title="Plugins"
          label="name"
          item-key="id"
          item-value="id"
          :items="plugins"
        />
        <expansion-panel-filter
          v-model="selectedUsers"
          title="Users"
          label="username"
          item-key="id"
          item-value="id"
          :items="users"
        />
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
        <plugin-tasks-table
          ref="pluginTaskTable"
          :plugin="plugin"
          :refresh-tasks="refreshTasks"
          :hide-columns="['id', 'task_name']"
          :selected-plugins="selectedPlugins"
          :selected-users="selectedUsers"
          :selected-tags="selectedTags"
          :search="search"
          @refresh-tags="getTags"
        />
      </template>
    </advanced-table>
  </div>
</template>

<script>
import moment from "moment";
import debounce from "lodash.debounce";

import PluginTasksTable from "@/components/plugins/PluginTasksTable.vue";
import ListPageTop from "@/components/ListPageTop.vue";
import DownloadMixin from "@/mixins/download-stager";
import ExpansionPanelFilter from "@/components/tables/ExpansionPanelFilter.vue";
import ExpansionPanelSearch from "@/components/tables/ExpansionPanelSearch.vue";
import AdvancedTable from "@/components/tables/AdvancedTable.vue";
import * as tagApi from "@/api/tag-api";
import { usePluginStore } from "@/store/plugin-module";
import { useUserStore } from "@/store/user-module";

export default {
  name: "PluginTasksList",
  components: {
    AdvancedTable,
    ExpansionPanelFilter,
    ExpansionPanelSearch,
    PluginTasksTable,
    ListPageTop,
  },
  mixins: [DownloadMixin],
  props: {
    plugin: {
      type: Object,
      required: false,
      default: null,
    },
    refreshTasks: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      breads: [
        {
          text: "Plugins",
          disabled: true,
          href: "/plugins",
        },
        {
          text: "Tasks",
          disabled: true,
          href: "/plugins?tab=tasks",
        },
      ],
      tasks: [],
      search: "",
      loading: false,
      moment,
      selectedPlugins: [],
      selectedUsers: [],
      selectedTags: [],
      tags: [],
      debouncedGetTasks: debounce(this.getTasks, 500),
    };
  },
  computed: {
    pluginStore() {
      return usePluginStore();
    },
    userStore() {
      return useUserStore();
    },
    plugins() {
      return this.pluginStore.plugins;
    },
    users() {
      const u = this.userStore.users;
      return [
        ...u,
        {
          id: 0,
          username: "Non-User",
        },
      ];
    },
  },
  watch: {
    plugin: {
      handler(val) {
        if (val) {
          this.selectedPlugins = [val.session_id];
        }
      },
      immediate: true,
    },
  },
  async mounted() {
    await Promise.all([
      this.pluginStore.getPlugins(),
      this.userStore.getUsers(),
      this.getTags(),
    ]);
  },
  methods: {
    async getTags() {
      const tags = await tagApi.getTags({
        page: 1,
        limit: -1,
        sources: "plugin_task",
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
    getTasks() {
      this.$refs.pluginTaskTable.debouncedGetTasks();
    },
  },
};
</script>

<style></style>
