<template>
  <div>
    <div>
      <portal to="app-bar-extension">
        <div style="display: flex; flex-direction: row; width: 100%">
          <v-tabs v-model="tab" align-with-title>
            <v-tab key="interact" href="#interact">
              Interact
              <v-icon x-small class="ml-1"> fa-arrow-pointer </v-icon>
            </v-tab>
            <v-tab key="file-browser" href="#file-browser">
              File Browser
              <v-icon x-small class="ml-1"> fa-folder-open </v-icon>
            </v-tab>
            <v-tab key="tasks" href="#tasks">
              Tasks
              <v-icon x-small class="ml-1"> fa-sticky-note </v-icon>
            </v-tab>
            <v-tab key="view" href="#view">
              View
              <v-icon x-small class="ml-1"> fa-eye </v-icon>
            </v-tab>
          </v-tabs>
          <div style="display: flex; flex-direction: row">
            <!-- Keeping infra in place to add the split pane back -->
            <v-btn v-if="false" icon @click="toggleCollapsePane()">
              <v-icon v-if="paneSize > 95"> fa-chevron-left </v-icon>
              <v-icon v-else> fa-chevron-right </v-icon>
            </v-btn>
          </div>
        </div>
      </portal>
      <portal to="app-bar">
        <div class="v-toolbar__content" style="width: 100%">
          <v-breadcrumbs :items="breads" />
          <v-tooltip v-if="agent.high_integrity" bottom>
            <template #activator="{ on }">
              <v-icon small v-on="on"> fa-user-cog </v-icon>
            </template>
            <span>Elevated Process</span>
          </v-tooltip>
          <v-chip v-if="initialized && archived"> Archived </v-chip>
          <v-spacer />
          <div
            v-if="!errorState && initialized && !archived"
            class="pt-2"
            style="display: flex; flex-direction: row; align-items: center"
          >
            <agent-script-import-dialog
              v-model="scriptImportDialog"
              :loading="scriptImportLoading"
              @submit="doScriptImport"
            />
            <agent-upload-dialog
              v-model="uploadDialog"
              :language="agent.language"
              :loading="uploadLoading"
              :path-to-file="pathToFile"
              @submit="doUpload"
            />
            <agent-download-dialog
              v-model="downloadDialog"
              :loading="downloadLoading"
              @submit="doDownload"
            />
            <tooltip-button-toggle
              v-model="isRefreshTasks"
              icon="fa-redo"
              :button-text="isRefreshTasks ? 'On' : 'Off'"
              text="Auto-refresh Tasks"
            />
            <tooltip-button
              icon="fa-calendar-times"
              text="Clear Queued Tasks"
              @click="clearQueue"
            />
            <tooltip-button
              icon="fa-upload"
              text="Upload"
              @click="uploadDialog = true"
            />
            <tooltip-button
              icon="fa-download"
              text="Download"
              @click="downloadDialog = true"
            />
            <tooltip-button
              icon="fa-file-import"
              text="Import Script"
              @click="scriptImportDialog = true"
            />
            <tooltip-button
              v-if="!hideSideBar"
              icon="fa-external-link-alt"
              text="Popout"
              @click="popout"
            />
            <tooltip-button
              v-if="!subscribed"
              icon="fa-bell"
              text="Subscribe to Notifications"
              @click="subscribe"
            />
            <tooltip-button
              v-else
              icon="fa-bell-slash"
              text="Unsubscribe from Notifications"
              @click="unsubscribe"
            />
            <tooltip-button
              icon="fa-sync"
              text="Reload SysInfo"
              @click="reloadSysInfo"
            />
            <tooltip-button
              v-if="initialized && !archived"
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
      <div v-if="!errorState" :style="splitPaneHeight()">
        <splitpanes :disabled="true" @resize="paneSize = $event[0].size">
          <pane min-size="30" :size="paneSize">
            <v-tabs-items v-model="tab" class="scrollable-pane">
              <v-tab-item
                key="interact"
                :value="'interact'"
                :transition="false"
                :reverse-transition="false"
              >
                <v-card v-if="initialized && !archived" flat>
                  <v-tabs v-model="interactTab" :height="30" align-with-title>
                    <v-tab key="form" href="#form">
                      Form
                      <v-icon x-small class="ml-1"> fa-list-check </v-icon>
                    </v-tab>
                    <v-tab key="terminal" href="#terminal">
                      Terminal (Beta)
                      <v-icon x-small class="ml-1"> fa-terminal </v-icon>
                    </v-tab>
                  </v-tabs>
                  <v-tabs-items v-model="interactTab">
                    <v-tab-item
                      key="form"
                      :value="'form'"
                      :transition="false"
                      :reverse-transition="false"
                    >
                      <agent-interact :agent="agent" />
                      <v-divider />
                      <h4 class="pl-4 pt-2">Execute Module</h4>
                      <agent-execute-module :agents="[agent.session_id]"
                    /></v-tab-item>
                    <v-tab-item
                      key="terminal"
                      style="height: 75vh"
                      :value="'terminal'"
                      :transition="false"
                      :reverse-transition="false"
                    >
                      <agent-terminal class="mt-2" :agent="agent" />
                    </v-tab-item>
                  </v-tabs-items>
                </v-card>
                <v-card v-else-if="initialized && archived" flat>
                  <v-card-text>
                    <v-alert
                      type="error"
                      icon="fa-exclamation-triangle"
                      :value="true"
                    >
                      This agent is archived.
                    </v-alert>
                  </v-card-text>
                </v-card>
              </v-tab-item>
              <v-tab-item
                key="browser"
                :value="'file-browser'"
                :transition="false"
                :reverse-transition="false"
              >
                <v-card flat>
                  <agent-file-browser
                    :agent="agent"
                    :read-only="initialized && archived"
                    @openUploadDialog="openUploadDialogPrefilled"
                  />
                </v-card>
              </v-tab-item>
              <v-tab-item
                key="tasks"
                :value="'tasks'"
                :transition="false"
                :reverse-transition="false"
              >
                <v-card flat>
                  <agent-tasks-list
                    :agent="agent"
                    :refresh-tasks="isRefreshTasks"
                  />
                </v-card>
              </v-tab-item>
              <v-tab-item
                key="view"
                :value="'view'"
                :transition="false"
                :reverse-transition="false"
              >
                <v-card flat>
                  <agent-form
                    :read-only="initialized && archived"
                    :agent="agent"
                    @refresh-agent="getAgent(id)"
                  />
                </v-card>
              </v-tab-item>
            </v-tabs-items>
          </pane>
          <!-- <pane :size="100 - paneSize">
            <div
              v-if="rightPaneInitialized"
              ref="bottomScrollable"
              class="right-pane"
            />
          </pane> -->
        </splitpanes>
      </div>
    </div>
  </div>
</template>

<script>
import AgentForm from "@/components/agents/AgentForm.vue";
import AgentInteract from "@/components/agents/AgentInteract.vue";
import AgentTasksList from "@/components/agents/AgentTasksList.vue";
import AgentExecuteModule from "@/components/agents/AgentExecuteModule.vue";
import AgentFileBrowser from "@/components/agents/AgentFileBrowser.vue";
import AgentTerminal from "@/components/agents/AgentTerminal.vue";
import AgentUploadDialog from "@/components/agents/AgentUploadDialog.vue";
import AgentScriptImportDialog from "@/components/agents/AgentScriptImportDialog.vue";
import AgentDownloadDialog from "@/components/agents/AgentDownloadDialog.vue";
import TooltipButton from "@/components/TooltipButton.vue";
import TooltipButtonToggle from "@/components/TooltipButtonToggle.vue";
import ErrorStateAlert from "@/components/ErrorStateAlert.vue";
import { Pane, Splitpanes } from "splitpanes";
import * as agentApi from "@/api/agent-api";
import * as agentTaskApi from "@/api/agent-task-api";

import "splitpanes/dist/splitpanes.css";
import { useAgentStore } from "@/stores/agent-module";

export default {
  name: "AgentEdit",
  components: {
    AgentForm,
    AgentInteract,
    AgentExecuteModule,
    AgentFileBrowser,
    AgentTasksList,
    AgentTerminal,
    AgentUploadDialog,
    AgentScriptImportDialog,
    AgentDownloadDialog,
    TooltipButton,
    TooltipButtonToggle,
    ErrorStateAlert,
    Splitpanes,
    Pane,
  },
  data() {
    return {
      agent: {},
      nameLoading: false,
      uploadLoading: false,
      downloadLoading: false,
      scriptImportLoading: false,
      nameDialog: false,
      uploadDialog: false,
      downloadDialog: false,
      scriptImportDialog: false,
      initialized: true,
      errorState: false,
      paneSize: 100,
      rightPaneInitialized: false,
      pathToFile: "",
      isRefreshTasks: true,
      interactTab: "form",
    };
  },
  computed: {
    agentStore() {
      return useAgentStore();
    },
    subscribedAgents() {
      return this.agentStore.subscribed;
    },
    subscribed() {
      return this.subscribedAgents[this.id] || false;
    },
    breads() {
      return [
        {
          text: "Agents",
          disabled: this.isChild,
          to: "/agents",
          exact: true,
        },
        {
          text: this.breadcrumbName,
          disabled: true,
          to: "/agent-edit",
        },
      ];
    },
    archived() {
      return this.agent.archived;
    },
    breadcrumbName() {
      return this.agent.name || this.id;
    },
    id() {
      return this.$route.params.id;
    },
    isChild() {
      return !!this.$route.query.hideSideBar;
    },
    hideSideBar() {
      return this.$route.query.hideSideBar;
    },
    // https://jareklipski.medium.com/linking-to-a-specific-tab-in-vuetify-js-d978525f2e1a
    tab: {
      set(tab) {
        this.$router.replace({ query: { ...this.$route.query, tab } });
      },
      get() {
        return this.$route.query.tab || "interact";
      },
    },
  },
  watch: {
    id(val) {
      if (val) {
        this.getAgent(val);
      }
    },
    paneSize(val) {
      if (this.rightPaneInitialized) {
        return;
      }
      if (val < 99) {
        this.rightPaneInitialized = true;
      }
    },
    uploadDialog(val) {
      if (!val) {
        this.pathToFile = "";
      }
    },
  },
  mounted() {
    this.getAgent(this.$route.params.id);
  },
  methods: {
    subscribe() {
      this.agentStore.subscribe({ sessionId: this.id });
    },
    unsubscribe() {
      this.agentStore.unsubscribe({ sessionId: this.id });
    },
    async reloadSysInfo() {
      try {
        await agentTaskApi.sysinfo(this.agent.session_id);
        this.$snack.success(`SysInfo reload queued for ${this.agent.name}`);
      } catch (error) {
        this.$snack.error(
          `Error reloading SysInfo for ${this.agent.name}: ${error.message}`,
        );
      }
    },
    toggleCollapsePane() {
      if (this.paneSize > 95) {
        this.paneSize = 50;
      } else {
        this.paneSize = 100;
      }
    },
    splitPaneHeight() {
      /* Not the prettiest thing, but seems to cover most window sizes to avoid page scroll.
     That's 96vh - height of top bar (104) - height of footer (36px) */
      return `height: calc(96vh - 104px ${this.isChild ? "" : "- 36px"})`;
    },
    popout() {
      window.open(
        `${window.location.href}/?hideSideBar=true`,
        "popup",
        "width=600,height=600",
      );
      this.$router.push({ name: "agents" });
    },
    getAgent(id) {
      agentApi
        .getAgent(id)
        .then((data) => {
          this.agent = data;
        })
        .catch(() => {
          this.errorState = true;
        });
    },
    async doScriptImport({ file }) {
      if (this.scriptImportLoading || file == null) return;

      this.scriptImportLoading = true;
      try {
        await agentTaskApi.scriptImport(this.agent.session_id, file);
        this.$snack.success(
          `Tasked agent ${this.agent.name} to import script ${file.filename}`,
        );
      } catch (err) {
        this.$snack.error(`Error: ${err}`);
      }
      this.scriptImportLoading = false;
      this.scriptImportDialog = false;
    },
    async killAgent() {
      if (
        await this.$root.$confirm(
          "Kill Agent",
          `Do you want to kill agent ${this.agent.name}?`,
          {
            color: "red",
          },
        )
      ) {
        this.agentStore.killAgent({ sessionId: this.agent.session_id });
        this.$snack.success(
          `Agent ${this.agent.name} tasked to run TASK_EXIT.`,
        );
        this.$router.push({ name: "agents" });
      }
    },
    async clearQueue() {
      const queuedTasks = await agentTaskApi.getTasks(this.agent.session_id, {
        limit: -1,
        page: 1,
        status: "queued",
      });
      const queuedIds = queuedTasks.records.map((el) => el.id);
      if (queuedIds.length === 0) {
        this.$snack.info("No queued tasks to clear.");
        return;
      }
      if (
        await this.$root.$confirm(
          "",
          `Do you want to clear ${queuedIds.length} queued tasks?`,
          {
            color: "red",
          },
        )
      ) {
        this.agentStore.clearQueue({
          sessionId: this.agent.session_id,
          tasks: queuedIds,
        });
        this.$snack.success(
          `Clearing queued tasks for Agent ${this.agent.session_id}.`,
        );
      }
    },
    openUploadDialogPrefilled({ pathToFile }) {
      this.uploadDialog = true;
      this.pathToFile = pathToFile;
    },
    async doUpload({ file, pathToFile }) {
      if (
        this.uploadLoading ||
        file == null ||
        pathToFile == null ||
        pathToFile.length < 1
      )
        return;

      this.uploadLoading = true;
      try {
        await agentTaskApi.uploadFile(this.agent.session_id, file, pathToFile);
        this.$snack.success(
          `Tasked agent ${this.agent.name} to upload file to ${pathToFile}`,
        );
      } catch (err) {
        this.$snack.error(`Error: ${err}`);
      }

      this.uploadLoading = false;
      this.uploadDialog = false;
    },
    async doDownload({ pathToFile }) {
      if (this.downloadLoading || pathToFile == null || pathToFile.length < 1)
        return;

      this.downloadLoading = true;
      try {
        await agentTaskApi.downloadFile(this.agent.session_id, pathToFile);
        this.$snack.success(
          `Tasked agent ${this.agent.name} to downloaded file ${pathToFile}`,
        );
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
      // this.$refs.bottomScrollable.scrollTop = this.$refs.bottomScrollable.scrollHeight;
    },
  },
};
</script>

<style lang="scss">
.scrollable-pane {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

// Overrides vuetify.css
// Because we moved the tabs into a div, which made the color funky.
.v-toolbar__content > div > .v-tabs > .v-slide-group.v-tabs-bar,
.v-toolbar__extension > div > .v-tabs > .v-slide-group.v-tabs-bar {
  background-color: inherit;
}

.splitpanes__splitter {
  background-color: #fff;
  box-sizing: border-box;
  position: relative;
  flex-shrink: 0;
  &:before,
  &:after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    background-color: rgba(0, 0, 0, 0.15);
    transition: background-color 0.3s;
  }
  &:hover:before,
  &:hover:after {
    background-color: rgba(0, 0, 0, 0.25);
  }
  &:first-child {
    cursor: auto;
  }
}
.splitpanes .splitpanes .splitpanes__splitter {
  z-index: 1;
}
.splitpanes--vertical > .splitpanes__splitter,
.splitpanes--vertical > .splitpanes__splitter {
  width: 7px;
  border-left: 1px solid #eee;
  margin-left: -1px;
  &:before,
  &:after {
    transform: translateY(-50%);
    width: 1px;
    height: 30px;
  }
  &:before {
    margin-left: -2px;
  }
  &:after {
    margin-left: 1px;
  }
}
.splitpanes--horizontal > .splitpanes__splitter,
.splitpanes--horizontal > .splitpanes__splitter {
  height: 7px;
  border-top: 1px solid #eee;
  margin-top: -1px;
  &:before,
  &:after {
    transform: translateX(-50%);
    width: 30px;
    height: 1px;
  }
  &:before {
    margin-top: -2px;
  }
  &:after {
    margin-top: 1px;
  }
}
</style>
