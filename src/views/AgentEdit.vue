<template>
  <div>
    <div
      style="display: flex; justify-content: space-between;"
    >
      <v-breadcrumbs :items="breads" />
      <div class="pt-2">
        <!-- TODO Wrap this into a component? -->
        <v-dialog
          ref="nameDialog"
          v-model="dialog"
          max-width="500px"
        >
          <v-card>
            <v-card-title>
              <span class="headline">Rename</span>
            </v-card-title>
            <v-card-text>
              <v-form
                ref="nameForm"
              >
                <v-container>
                  <v-row>
                    <v-col
                      cols="12"
                    >
                      <v-text-field
                        v-model="nameForm.name"
                        label="Name"
                        :rules="nameRules['name']"
                        outlined
                        dense
                        required
                      />
                    </v-col>
                  </v-row>
                </v-container>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="blue darken-1"
                text
                @click="dialog = false"
              >
                Close
              </v-btn>
              <v-btn
                color="blue darken-1"
                text
                :loading="nameLoading"
                @click="renameAgent"
              >
                Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-tooltip
          bottom
        >
          <template v-slot:activator="{ on }">
            <v-btn
              color="primary"
              class="mr-2"
              fab
              x-small
              v-on="on"
              @click="dialog = true"
            >
              <v-icon
                style="padding-left: 4px"
              >
                fa-user-edit
              </v-icon>
            </v-btn>
          </template>
          <span>Rename Agent</span>
        </v-tooltip>
        <v-tooltip bottom>
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
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              color="error"
              class="mr-2"
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
        <v-tooltip
          v-if="!isChild"
          bottom
        >
          <template v-slot:activator="{ on }">
            <v-btn
              fab
              x-small
              v-on="on"
              @click="popout"
            >
              <v-icon>fa-external-link-alt</v-icon>
            </v-btn>
          </template>
          <span>New Window</span>
        </v-tooltip>
      </div>
    </div>
    <div :style="splitPaneHeight()">
      <split-pane
        :min-percent="20"
        :default-percent="60"
        split="vertical"
      >
        <template slot="paneL">
          <v-tabs
            v-model="activeTab"
            class="scrollable-pane"
            fixed-tabs
          >
            <v-tab
              key="interact"
              href="#tab-interact"
            >
              Interact
            </v-tab>
            <v-tab
              key="tasks"
              href="#tab-tasks"
            >
              Tasks
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
                <h4 class="pl-4">
                  Execute Module
                </h4>
                <agent-execute-module :agents="[agent.name]" />
              </v-card>
            </v-tab-item>
            <v-tab-item
              key="tasks"
              :value="'tab-tasks'"
            >
              <v-card
                class="scrollable-pane"
                flat
              >
                <agent-command-history
                  :agent-name="agent.name"
                  :task-results="taskResults"
                />
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
            class="right-pane"
          >
            <agent-command-viewer
              :name="this.$route.params.id"
              :task-results="taskResults"
              :initialized="initialized"
              @new-results="scrollResults"
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
import AgentCommandHistory from '@/components/agents/AgentCommandHistory.vue';
import AgentExecuteModule from '@/components/agents/AgentExecuteModule.vue';
import AgentCommandViewer from '@/components/agents/AgentCommandViewer.vue';
import SplitPane from 'vue-splitpane';
import * as agentApi from '@/api/agent-api';

// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcRenderer } from 'electron';

export default {
  name: 'AgentEdit',
  components: {
    AgentForm,
    AgentInteract,
    AgentExecuteModule,
    AgentCommandViewer,
    AgentCommandHistory,
    SplitPane,
  },
  data() {
    return {
      agent: {},
      nameRules: {
        name: [
          v => !!v || 'Name is required',
          v => (!!v && v.length > 4) || 'Name must be at least 5 characters',
        ],
      },
      nameLoading: false,
      nameForm: {},
      activeTab: 'View',
      dialog: false,
      interval: null,
      taskResults: [],
      initialized: false,
    };
  },
  computed: {
    breads() {
      return [
        {
          text: 'Agents',
          disabled: this.isChild,
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
    isChild() {
      return !!this.$route.query.hideSideBar;
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
  beforeDestroy() {
    clearInterval(this.interval);
  },
  methods: {
    splitPaneHeight() {
      /* Not the prettiest thing, but seems to cover most window sizes to avoid page scroll.
     That's 96vh - height of breadcrumbs (57) - height of footer (36px) */
      return `height: calc(96vh - 57px ${this.isChild ? '' : '- 36px'})`;
    },
    popout() {
      ipcRenderer.send('agentWindowOpen', { id: this.$route.params.id });
      this.$router.push({ name: 'agents' });
    },
    getAgent(id) {
      agentApi.getAgent(id)
        .then((data) => {
          this.agent = data;
          if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
          }
          this.interval = setInterval(async () => {
            this.taskResults = await agentApi.getResults(this.agent.name);
            this.initialized = true;
          }, 5000);
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
    async renameAgent() {
      if (this.nameLoading || !this.$refs.nameForm.validate()) { return; }

      this.nameLoading = true;
      try {
        await this.$store.dispatch('agent/rename', { oldName: this.agent.name, newName: this.nameForm.name });
        this.$toast.success(`Agent ${this.agent.name} tasked to change name.`);
        this.$router.push({ name: 'agents' });
      } catch (err) {
        this.$toast.error(`Error: ${err}`);
      }

      this.nameLoading = false;
      this.dialog = false;
    },
    /**
     * When new results appear in the AgentCommandViewer, scroll it down to the bottom.
     */
    scrollResults() {
      this.$refs.bottomScrollable.scrollTop = this.$refs.bottomScrollable.scrollHeight;
    },
  },
};
</script>

<style>
.scrollable-pane {
  max-height: 100%;
  overflow: auto;
}

.right-pane {
  background-color: white;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
