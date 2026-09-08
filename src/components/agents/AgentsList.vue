<template>
  <div>
    <list-page-top
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
          color="primary"
          label="Hide Stale Agents"
        />
        <v-switch
          v-model="applicationStore.hideArchivedAgents"
          color="primary"
          class="pl-4"
          label="Hide Archived Agents"
        />
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
import ListPageTop from "@/components/ListPageTop.vue";
import ExpansionPanelFilter from "@/components/tables/ExpansionPanelFilter.vue";
import AgentsTable from "@/components/agents/AgentsTable.vue";
import AdvancedTable from "@/components/tables/AdvancedTable.vue";
import { fetchTags } from "@/utils/tags";
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
  inject: ["snack", "confirm"],
  data() {
    return {
      breads: [
        {
          title: "Agents",
          disabled: true,
          href: "/agents",
        },
      ],
      selected: [],
      selectedTags: [],
      tags: [],
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
    showDelete() {
      return this.selected.length > 0;
    },
  },
  async mounted() {
    this.getTags();
  },
  methods: {
    async getTags() {
      this.tags = await fetchTags("agent");
    },
    async killAgents() {
      if (
        await this.confirm(
          "Kill Agent",
          `Do you want to kill ${this.selected.length} agents?`,
          { color: "red" },
        )
      ) {
        const total = this.selected.length;
        const result = await Promise.allSettled(
          this.selected.map((sessionId) =>
            this.agentStore.killAgent({ sessionId }),
          ),
        );
        const failed = result.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          this.snack.error(
            `Failed to task ${failed} of ${total} agents to run TASK_EXIT.`,
          );
        } else {
          this.snack.success(`${total} agents tasked to run TASK_EXIT.`);
        }
        this.selected = [];
      }
    },
    getAgents() {
      this.$refs.agentsTable.getAgents();
    },
    async killAgent(item) {
      if (
        await this.confirm(
          "Kill Agent",
          `Do you want to kill agent ${item.name}?`,
          { color: "red" },
        )
      ) {
        try {
          await this.agentStore.killAgent({ sessionId: item.session_id });
          this.snack.success(`Agent ${item.name} tasked to run TASK_EXIT.`);
        } catch (err) {
          this.snack.error(`Failed to kill agent ${item.name}: ${err}`);
        }
      }
    },
  },
};
</script>

<style scoped></style>
