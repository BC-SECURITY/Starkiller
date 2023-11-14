<template>
  <div>
    <list-page-top
      v-if="active && useHeader"
      :breads="breads"
      :show-create="false"
      :show-refresh="true"
      :show-delete="false"
      :is-auto-refresh="true"
      :auto-refresh="useHeader ? autoRefresh : refreshTasks"
      refresh-text="Auto-refresh Tasks"
      @update:auto-refresh="autoRefresh = $event"
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
          v-if="!agent"
          v-model="selectedAgents"
          title="Agents"
          label="name"
          item-key="session_id"
          item-value="session_id"
          :items="agents"
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
        <agent-tasks-table
          ref="agentTasksTable"
          :agent="agent"
          :refresh-tasks="useHeader ? autoRefresh : refreshTasks"
          :hide-columns="['id', 'task_name']"
          :selected-agents="selectedAgents"
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
import { mapState } from "pinia";

import AgentTasksTable from "@/components/agents/AgentTasksTable.vue";
import ListPageTop from "@/components/ListPageTop.vue";
import DownloadMixin from "@/mixins/download-stager";
import ExpansionPanelFilter from "@/components/tables/ExpansionPanelFilter.vue";
import ExpansionPanelSearch from "@/components/tables/ExpansionPanelSearch.vue";
import AdvancedTable from "@/components/tables/AdvancedTable.vue";
import * as tagApi from "@/api/tag-api";
import { useUserStore } from "@/stores/user-module";
import { useAgentStore } from "@/stores/agent-module";

export default {
  name: "AgentTasksList",
  components: {
    AdvancedTable,
    ExpansionPanelFilter,
    ExpansionPanelSearch,
    AgentTasksTable,
    ListPageTop,
  },
  mixins: [DownloadMixin],
  props: {
    agent: {
      type: Object,
      required: false,
      default: null,
    },
    // Whether the list-page-top component should be used.
    useHeader: {
      type: Boolean,
      default: false,
    },
    // If useHeader is true, this will be ignored.
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
          text: "Agents",
          disabled: true,
          href: "/agents",
        },
        {
          text: "Tasks",
          disabled: true,
          href: "/agents?tab=tasks",
        },
      ],
      tasks: [],
      search: "",
      loading: false,
      moment,
      selectedAgents: [],
      selectedUsers: [],
      selectedTags: [],
      tags: [],
      autoRefresh: true,
    };
  },
  computed: {
    agentStore() {
      return useAgentStore();
    },
    userStore() {
      return useUserStore();
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
    ...mapState(useAgentStore, ["agents"]),
  },
  watch: {
    agent: {
      handler(val) {
        if (val) {
          this.selectedAgents = [val.session_id];
        }
      },
      immediate: true,
    },
  },
  async mounted() {
    await Promise.all([
      this.agentStore.getAgents(),
      this.userStore.getUsers(),
      this.getTags(),
    ]);
  },
  methods: {
    async getTags() {
      const tags = await tagApi.getTags({
        page: 1,
        limit: -1,
        sources: "agent_task",
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
      this.$refs.agentTasksTable.debouncedGetTasks();
    },
  },
};
</script>

<style></style>
