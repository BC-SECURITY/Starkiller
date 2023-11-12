<template>
  <div class="p4">
    <edit-page-top :breads="breads" :show-submit="true" @submit="submit" />
    <h4 class="pl-4 pb-4">Execute Module</h4>
    <v-autocomplete
      v-model="selectedAgents"
      dense
      outlined
      chips
      multiple
      placeholder="Agents"
      :items="agents"
      item-text="name"
      item-value="session_id"
    />
    <v-card>
      <agent-execute-module
        ref="executeform"
        :module-name="moduleName"
        :agents="selectedAgents"
        :show-submit="false"
        @moduleChange="moduleChange"
        @submitted="clearAgents"
      />
    </v-card>
  </div>
</template>

<script>
import AgentExecuteModule from "@/components/agents/AgentExecuteModule.vue";
import EditPageTop from "@/components/EditPageTop.vue";
import { useAgentStore } from "@/stores/agent-module";

export default {
  name: "ModuleExecute",
  components: {
    AgentExecuteModule,
    EditPageTop,
  },
  data() {
    return {
      selectedAgents: [],
      moduleName: "",
    };
  },
  computed: {
    agentStore() {
      return useAgentStore();
    },
    agents() {
      return this.agentStore.agents.filter(
        (agent) => agent.archived === false && agent.stale === false,
      );
    },
    breads() {
      return [
        {
          text: "Modules",
          disabled: false,
          to: "/modules",
          exact: true,
        },
        {
          text: `${this.moduleName}`,
          disabled: true,
          to: "/modules/execute",
        },
      ];
    },
  },
  mounted() {
    this.getAgents();
    this.moduleName = this.$route.params.id;
  },
  methods: {
    submit() {
      this.$refs.executeform.create();
    },
    moduleChange(val) {
      this.moduleName = val;
      this.$router.push({ name: "moduleExecute", params: { id: val } });
    },
    getAgents() {
      this.agentStore.getAgents();
    },
    clearAgents() {
      this.selectedAgents = [];
    },
  },
};
</script>

<style></style>
