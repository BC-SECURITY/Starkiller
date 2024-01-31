<template>
  <div>
    <list-page-top
      v-if="active"
      :breads="breads"
      :show-create="false"
      :show-refresh="true"
      :show-delete="showDelete"
      :is-auto-refresh="true"
      :auto-refresh="autoRefresh"
      refresh-text="Auto-refresh Agents"
      delete-text="Kill"
      @update:auto-refresh="autoRefresh = $event"
      @delete="killAgents"
      @refresh="getAgents"
    />
    <advanced-table>
      <template #filters>
        <v-switch
          v-model="applicationStore.hideStaleAgents"
          label="Hide Stale Agents"
        />
        <v-switch
          v-model="applicationStore.hideArchivedAgents"
          class="pl-4"
          label="Hide Archived Agents"
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
        <agents-table
          ref="agentsTable"
          v-model="selected"
          :hide-stale-agents="applicationStore.hideStaleAgents"
          :hide-archived-agents="applicationStore.hideArchivedAgents"
          :selected-tags="selectedTags"
          :refresh-agents="autoRefresh"
          @refresh-tags="getTags"
          @kill-agent="killAgent"
        />
      </template>
    </advanced-table>
  </div>
</template>

<script>
import moment from "moment";
import ListPageTop from "@/components/ListPageTop.vue";
import ExpansionPanelFilter from "@/components/tables/ExpansionPanelFilter.vue";
import AgentsTable from "@/components/agents/AgentsTable.vue";
import AdvancedTable from "@/components/tables/AdvancedTable.vue";
import * as tagApi from "@/api/tag-api";
import { useAgentStore } from "@/stores/agent-module";
import { useApplicationStore } from "@/stores/application-module";

export default {
  name: "AgentsList",
  components: {
    AdvancedTable,
    ExpansionPanelFilter,
    AgentsTable,
    ListPageTop,
  },
  props: {
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
          text: "List",
          disabled: true,
          href: "/agents?tab=list-view",
        },
      ],
      selected: [],
      selectedTags: [],
      tags: [],
      moment,
      autoRefresh: true,
    };
  },
  computed: {
    agentStore() {
      return useAgentStore();
    },
    applicationStore() {
      return useApplicationStore();
    },
    agents() {
      return this.agentStore.agents;
    },
    sortedAgents() {
      let sorted = this.agents.slice();
      sorted.sort((a, b) => -a.lastseen_time.localeCompare(b.lastseen_time));
      if (this.hideStaleAgents) {
        sorted = sorted.filter((agent) => !agent.stale);
      }
      if (this.hideArchivedAgents) {
        sorted = sorted.filter((agent) => !agent.archived);
      }
      if (this.selectedTags.length === 0) {
        return sorted;
      }

      sorted = sorted.filter((agent) => {
        const agentTags = agent.tags.map((tag) => `${tag.name}:${tag.value}`);
        return agentTags.some((tag) => this.selectedTags.includes(tag));
      });

      return sorted;
    },
    showDelete() {
      return this.selected.length > 0;
    },
  },
  async mounted() {
    this.getTags();
  },
  methods: {
    async getTags() {
      const tags = await tagApi.getTags({
        page: 1,
        limit: -1,
        sources: "agent",
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
    async killAgents() {
      if (
        await this.$root.$confirm(
          "Kill Agent",
          `Do you want to kill ${this.selected.length} agents?`,
          { color: "red" },
        )
      ) {
        this.selected.forEach((agent) => {
          this.agentStore.killAgent({ sessionId: agent.session_id });
        });
        this.$snack.success(
          `${this.selected.length} agents tasked to run TASK_EXIT.`,
        );
        this.selected = [];
      }
    },
    getAgents() {
      this.$refs.agentsTable.getAgents();
    },
    async killAgent(item) {
      if (
        await this.$root.$confirm(
          "Kill Agent",
          `Do you want to kill agent ${item.name}?`,
          { color: "red" },
        )
      ) {
        this.agentStore.killAgent({ sessionId: item.session_id });
        this.$snack.success(`Agent ${item.name} tasked to run TASK_EXIT.`);
      }
    },
  },
};
</script>

<style scoped></style>
