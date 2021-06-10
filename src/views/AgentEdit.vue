<template>
  <div>
    <div>
      <portal
        to="app-bar-extension"
      >
        <v-tabs
          v-model="activeTab"
          align-with-title
          class="scrollable-pane"
        >
          <v-tab
            key="interact"
            href="#tab-interact"
          >
            Interact
          </v-tab>
          <v-tab
            key="file-browser"
            href="#tab-file-browser"
          >
            File Browser
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
        </v-tabs>
      </portal>
      <portal
        to="app-bar"
      >
        <div
          class="v-toolbar__content"
          style="width:100%"
        >
          <v-breadcrumbs :items="breads" />
          <v-spacer />
          <div
            v-if="!errorState"
            class="pt-2"
          >
            <agent-name-dialog
              v-model="nameDialog"
              :loading="nameLoading"
              @submit="renameAgent"
            />
            <agent-upload-dialog
              v-model="uploadDialog"
              :language="agent.language"
              :loading="uploadLoading"
              @submit="doUpload"
            />
            <agent-download-dialog
              v-model="downloadDialog"
              :loading="downloadLoading"
              @submit="doDownload"
            />
            <agent-tooltip-button
              icon="fa-user-edit"
              text="Rename Agent"
              color="primary"
              :pad-left="4"
              @click="nameDialog = true"
            />
            <agent-tooltip-button
              icon="fa-calendar-times"
              text="Clear Queued Tasks"
              color="primary"
              @click="clearQueue"
            />
            <agent-tooltip-button
              icon="fa-upload"
              text="Upload"
              @click="uploadDialog = true"
            />
            <agent-tooltip-button
              icon="fa-download"
              text="Download"
              @click="downloadDialog = true"
            />
            <agent-tooltip-button
              icon="fa-external-link-alt"
              text="New Window"
              @click="popout"
            />
            <agent-tooltip-button
              icon="fa-trash-alt"
              text="Kill Agent"
              color="error"
              @click="killAgent"
            />
          </div>
        </div>
      </portal>
      <error-state-alert
        v-if="errorState"
        :resource-id="id"
        resource-type="agent"
      />
      <div
        v-if="!errorState"
        :style="splitPaneHeight()"
      >
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
                key="browser"
                :value="'tab-file-browser'"
              >
                <v-card
                  class="scrollable-pane"
                  flat
                >
                  <!-- TODO While most agent endpoints will accept name or session_id,
                the file browser endpoints only use session_id.
                So if the agent gets renamed, the file browser references break.
                In a future release, all agent endpoints should just use session_id by default,
                since it is an immutable field. The API will probably be updated to only
                look up by session_id -->
                  <agent-file-browser :agent-name="agent.session_id" />
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
                    :task-results="taskResultsDeduped"
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
                :name="$route.params.id"
                :task-results="taskResultsDeduped"
                :initialized="initialized"
                @new-results="scrollResults"
              />
            </div>
          </template>
        </split-pane>
      </div>
    </div>
  </div>
</template>

<script>
import AgentForm from '@/components/agents/AgentForm.vue';
import AgentInteract from '@/components/agents/AgentInteract.vue';
import AgentCommandHistory from '@/components/agents/AgentCommandHistory.vue';
import AgentExecuteModule from '@/components/agents/AgentExecuteModule.vue';
import AgentCommandViewer from '@/components/agents/AgentCommandViewer.vue';
import AgentFileBrowser from '@/components/agents/AgentFileBrowser.vue';
import AgentNameDialog from '@/components/agents/AgentNameDialog.vue';
import AgentUploadDialog from '@/components/agents/AgentUploadDialog.vue';
import AgentDownloadDialog from '@/components/agents/AgentDownloadDialog.vue';
import AgentTooltipButton from '@/components/agents/AgentTooltipButton.vue';
import ErrorStateAlert from '@/components/ErrorStateAlert.vue';

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
    AgentFileBrowser,
    AgentCommandHistory,
    AgentNameDialog,
    AgentUploadDialog,
    AgentDownloadDialog,
    AgentTooltipButton,
    SplitPane,
    ErrorStateAlert,
  },
  data() {
    return {
      agent: {},
      nameLoading: false,
      uploadLoading: false,
      downloadLoading: false,
      activeTab: 'View',
      nameDialog: false,
      uploadDialog: false,
      downloadDialog: false,
      interval: null,
      taskResults: [],
      initialized: false,
      errorState: false,
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
    newestTaskingTime() {
      if (this.taskResults?.length > 0) {
        const temp = [...this.taskResults]
          .map((t) => t.updated_at)
          .map((t) => t.split('.')[0]);
        temp.sort((a, b) => b.localeCompare(a));
        return temp[0];
      }
      return '';
    },
    taskResultsDeduped() {
      let temp = [...this.taskResults];
      temp.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      temp = temp
        .reduce((unique, item) => (unique.some((t) => t.taskID === item.taskID)
          ? unique
          : [...unique, item]), []);
      return temp.reverse();
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
     That's 96vh - height of top bar (104) - height of footer (36px) */
      return `height: calc(96vh - 104px ${this.isChild ? '' : '- 36px'})`;
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
            let temp = await agentApi.getResults(this.agent.name, this.newestTaskingTime);
            temp = temp[0]?.AgentResults || [];
            this.taskResults = [...this.taskResults, ...temp];
            this.initialized = true;
          }, 7000);
        })
        .catch(() => {
          this.errorState = true;
        });
    },
    async killAgent() {
      if (await this.$root.$confirm('Kill Agent', `Do you want to kill agent ${this.agent.name}?`, { color: 'red' })) {
        this.$store.dispatch('agent/killAgent', { name: this.agent.name });
        this.$snack.success(`Agent ${this.agent.name} tasked to run TASK_EXIT.`);
        this.$router.push({ name: 'agents' });
      }
    },
    async clearQueue() {
      if (await this.$root.$confirm('', 'Do you want to clear queue?', { color: 'red' })) {
        this.$store.dispatch('agent/clearQueue', { name: this.agent.name });
        this.$snack.success(`Clearing queued tasks for Agent ${this.agent.name}.`);
      }
    },
    async renameAgent({ name }) {
      if (this.nameLoading || name == null || name.length < 5) { return; }

      this.nameLoading = true;
      try {
        const response = await this.$store.dispatch('agent/rename', { oldName: this.agent.name, newName: name });
        this.$snack.success(`Agent ${this.agent.name} tasked to change name.`);
        this.$router.push({ name: 'agentEdit', params: { id: response } });
      } catch (err) {
        this.$snack.error(`Error: ${err}`);
      }

      this.nameLoading = false;
      this.nameDialog = false;
    },
    async doUpload({ file, pathToFile }) {
      if (this.uploadLoading || file == null || pathToFile == null || pathToFile.length < 1) return;

      this.uploadLoading = true;
      try {
        await agentApi.uploadFile(this.agent.name, file, pathToFile);
      } catch (err) {
        this.$snack.error(`Error: ${err}`);
      }

      this.uploadLoading = false;
      this.uploadDialog = false;
    },
    async doDownload({ pathToFile }) {
      if (this.downloadLoading || pathToFile == null || pathToFile.length < 1) return;

      this.downloadLoading = true;
      try {
        await agentApi.downloadFile(this.agent.name, pathToFile);
      } catch (err) {
        this.$snack.error(`Error: ${err}`);
      }

      this.downloadLoading = false;
      this.downloadDialog = false;
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
