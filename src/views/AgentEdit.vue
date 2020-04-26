<template>
  <div>
    <v-breadcrumbs :items="breads" />
    <div
      class="mb-2"
      style="display: flex; justify-content: flex-end;"
    >
      <!-- TODO Wrap this into a component? -->
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <v-btn
            color="primary"
            class="mr-2"
            fab
            x-small
            v-on="on"
            @click="clearQueue"
          >
            <v-icon>fa-calendar-times</v-icon>
          </v-btn>
        </template>
        <span>Clear Queued Tasks</span>
      </v-tooltip>
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <v-btn
            color="error"
            fab
            x-small
            v-on="on"
            @click="killAgent"
          >
            <v-icon>fa-trash-alt</v-icon>
          </v-btn>
        </template>
        <span>Kill Agent</span>
      </v-tooltip>
    </div>
    <div class="split-view">
      <split-pane
        :min-percent="20"
        :default-percent="60"
        split="horizontal"
      >
        <template slot="paneL">
          <v-tabs
            v-model="activeTab"
            class="scrollable-pane"
            small
            grow
          >
            <v-tab
              key="interact"
              href="#tab-interact"
            >
              Interact
            </v-tab>
            <v-tab
              key="view"
              href="#tab-view"
            >
              View
            </v-tab>
            <v-tab-item
              key="interact"
              :value="'tab-interact'"
            >
              <v-card
                class="scrollable-pane"
                flat
              >
                <agent-interact :agent="agent" />
                <v-divider />
                <agent-execute-module :agent-name="agent.name" />
              </v-card>
            </v-tab-item>
            <v-tab-item
              key="view"
              :value="'tab-view'"
            >
              <v-card
                class="scrollable-pane"
                flat
              >
                <agent-form :agent="agent" />
              </v-card>
            </v-tab-item>
          </v-tabs>
        </template>
        <template slot="paneR">
          <div
            ref="bottomScrollable"
            class="bottom-pane"
          >
            <agent-command-viewer
              :name="this.$route.params.id"
            />
          </div>
        </template>
      </split-pane>
    </div>
  </div>
</template>

<script>
import AgentForm from '@/components/agents/AgentForm.vue';
import AgentInteract from '@/components/agents/AgentInteract.vue';
import AgentExecuteModule from '@/components/agents/AgentExecuteModule.vue';
import AgentCommandViewer from '@/components/agents/AgentCommandViewer.vue';
import SplitPane from 'vue-splitpane';
import * as agentApi from '@/api/agent-api';

export default {
  name: 'AgentEdit',
  components: {
    AgentForm,
    AgentInteract,
    AgentExecuteModule,
    AgentCommandViewer,
    SplitPane,
  },
  data() {
    return {
      agent: {},
      activeTab: 'View',
    };
  },
  computed: {
    breads() {
      return [
        {
          text: 'Agents',
          disabled: false,
          to: '/agents',
          exact: true,
        },
        {
          text: `${this.id}`,
          disabled: true,
          to: '/agent-edit',
        },
      ];
    },
    id() {
      return this.$route.params.id;
    },
  },
  watch: {
    id(val) {
      if (val) {
        this.getAgent(val);
      }
    },
  },
  mounted() {
    this.getAgent(this.$route.params.id);
  },
  methods: {
    getAgent(id) {
      agentApi.getAgent(id)
        .then((data) => {
          this.agent = data;
        });
    },
    async killAgent() {
      if (await this.$root.$confirm('Kill Agent', `Do you want to kill agent ${this.agent.name}?`, { color: 'red' })) {
        this.$store.dispatch('agent/killAgent', { name: this.agent.name });
        this.$toast.success(`Agent ${this.agent.name} tasked to run TASK_EXIT.`);
        this.$router.push({ name: 'agents' });
      }
    },
    async clearQueue() {
      if (await this.$root.$confirm('', 'Do you want to clear queue?', { color: 'red' })) {
        this.$store.dispatch('agent/clearQueue', { name: this.agent.name });
        this.$toast.success(`Clearing queued tasks for Agent ${this.agent.name}.`);
      }
    },
  },
};
</script>

<style>
.split-view {
  /* Not the prettiest thing, but seems to cover most window sizes to avoid page scroll.
     That's 94vh - height of breadcrumbs (57) - height of interact buttons (32px)
     - height of footer (36px) */
  height: calc(94vh - 57px - 32px - 36px);
}

.scrollable-pane {
  max-height: 100%;
  overflow: auto;
}

.bottom-pane {
  background-color: white;
  height: 100%;
  overflow-y: auto;
}
</style>
