<template>
  <div>
    <div
      class="ml-3 mr-3 align-center"
      style="display: flex; flex-direction: row-reverse"
    >
      <div style="height: 40px" />
      <header-menu
        :headers-full="headersFull"
        :initial-selected-headers="selectedHeadersTemp"
        :default-headers="headersFull.filter((h) => h.defaultHeader === true)"
        @submit="submitHeaderForm"
      />
    </div>
    <v-pagination
      v-model="currentPage"
      :length="totalPages"
      :total-visible="10"
      @input="handlePageChange"
    />
    <v-data-table
      :headers="headers"
      :items="tasks"
      item-key="uniqueId"
      :sort-by="sortBy"
      :sort-desc="sortDesc"
      :server-items-length="totalItems"
      :footer-props="{ 'items-per-page-options': [10, 25, 50, 100] }"
      :items-per-page.sync="itemsPerPage"
      :loading="loading"
      :page="currentPage"
      show-expand
      @item-expanded="handleItemExpanded"
      @update:options="handleOptionsChange"
    >
      <template #expanded-item="{ headers: scopedHeaders, item }">
        <td :colspan="scopedHeaders.length" class="pa-4">
          <v-card flat>
            <v-card-title class="subtitle-1 pb-4">
              <v-row no-gutters align="center">
                <v-col cols="4">
                  <span class="font-weight-bold">Task #{{ item.id }}</span>
                  <v-chip
                    v-if="item.module_name || item.task_name"
                    small
                    class="ml-2"
                    color="primary"
                    outlined
                  >
                    {{ item.module_name || item.task_name }}
                  </v-chip>
                </v-col>
                <v-col
                  v-if="
                    (expandedTasks[item.uniqueId].options &&
                      Object.keys(expandedTasks[item.uniqueId].options).length >
                        0) ||
                    (expandedTasks[item.uniqueId].module_options &&
                      Object.keys(expandedTasks[item.uniqueId].module_options)
                        .length > 0)
                  "
                  cols="6"
                >
                  <div class="d-flex flex-wrap gap-2">
                    <span class="font-weight-bold ml-2 mr-2 subtitle-1"
                      >Options:</span
                    >
                    <v-chip
                      v-for="(value, key) in expandedTasks[item.uniqueId]
                        .options || expandedTasks[item.uniqueId].module_options"
                      :key="key"
                      small
                      label
                      class="mr-1 mb-1"
                    >
                      <span class="subtitle-2 font-weight-bold mr-1"
                        >{{ key }}:</span
                      >
                      <span class="subtitle-2">{{
                        value.length > 20
                          ? value.substring(0, 20) + "..."
                          : value
                      }}</span>
                    </v-chip>
                  </div>
                </v-col>
                <v-col class="text-right">
                  <v-switch
                    v-model="expandedTasks[item.uniqueId].backgroundColor"
                    false-value="white"
                    true-value="black"
                    label="Dark Mode Output"
                    hide-details
                    class="mt-0 pt-0 d-inline-block"
                    @change="updateTaskBackgroundColor(item)"
                  />
                </v-col>
              </v-row>
            </v-card-title>
            <v-divider />

            <v-card-text>
              <v-row dense>
                <v-col cols="12">
                  <div class="mb-4">
                    <div class="d-flex align-center mb-1">
                      <span class="subtitle-2 font-weight-bold"
                        >Task Input</span
                      >
                      <v-spacer />
                      <tooltip-button
                        :icon="item.expandedInput ? 'fa-minus' : 'fa-plus'"
                        :text="
                          item.expandedInput ? 'Show Less' : 'See Full Input'
                        "
                        x-small
                        @click="toggleSeeFullInput(item)"
                      />
                    </div>
                    <div
                      :class="
                        'mono rounded pa-2 ' +
                        (expandedTasks[item.uniqueId].backgroundColor ===
                        'white'
                          ? 'font-black'
                          : 'font-white')
                      "
                      :style="
                        'background-color: ' +
                        expandedTasks[item.uniqueId].backgroundColor +
                        ';'
                      "
                    >
                      {{
                        addBlankLines(
                          item.expandedInput
                            ? expandedTasks[item.uniqueId].full_input
                            : item.input,
                        )
                      }}
                    </div>
                  </div>

                  <div v-if="hasOutput(item)">
                    <div class="d-flex align-center mb-1">
                      <span class="subtitle-2 font-weight-bold"
                        >Task Output</span
                      >
                      <v-spacer />
                      <v-btn
                        v-if="
                          item.downloads.length > 0 &&
                          item.downloads.some((d) =>
                            d.filename.match(/[^/]+(jpg|jpeg|png|gif)$/),
                          )
                        "
                        text
                        x-small
                        @click="getImagesForTask(item)"
                      >
                        View Images
                      </v-btn>
                    </div>

                    <div
                      v-if="
                        item.downloads.length > 0 &&
                        item.downloads.some((d) =>
                          d.filename.match(/[^/]+(jpg|jpeg|png|gif)$/),
                        )
                      "
                    >
                      <div class="d-flex flex-wrap gap-2 mb-2">
                        <v-img
                          v-for="download in item.downloads"
                          :key="download.id"
                          :src="imageData(item, download)"
                          :alt="download.filename"
                          :max-width="400"
                          class="grey lighten-2 rounded mb-2"
                          contain
                        >
                          <template #placeholder>
                            <v-row
                              class="fill-height ma-0"
                              align="center"
                              justify="center"
                            >
                              <v-progress-circular
                                indeterminate
                                color="grey lighten-5"
                              />
                            </v-row>
                          </template>
                        </v-img>
                      </div>
                    </div>

                    <div
                      :class="
                        'mono rounded pa-2 ' +
                        (expandedTasks[item.uniqueId].backgroundColor ===
                        'white'
                          ? 'font-black'
                          : 'font-white')
                      "
                      :style="
                        'background-color: ' +
                        expandedTasks[item.uniqueId].backgroundColor +
                        ';'
                      "
                    >
                      <div
                        v-if="expandedTasks[item.uniqueId].htmlOutput"
                        v-html="expandedTasks[item.uniqueId].htmlOutput"
                      />
                      <div v-else>
                        {{ addBlankLines(item.output) }}
                      </div>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </td>
      </template>
      <template #item.status="{ item }">
        <v-icon v-if="item.status === 'pulled'" color="blue" small>
          fa-check-square
        </v-icon>
        <v-icon v-else-if="item.status === 'queued'" color="orange" small>
          fa-clock
        </v-icon>
        <v-icon v-else-if="item.status === 'completed'" color="green" small>
          fa-check-circle
        </v-icon>
        <v-icon v-else-if="item.status === 'error'" color="red" small>
          fa-times-circle
        </v-icon>
        <v-icon v-else-if="item.status === 'continuous'" color="purple" small>
          fa-infinity
        </v-icon>
      </template>
      <template v-if="!agent" #item.agent_id="{ item }">
        <router-link
          style="color: inherit"
          :to="{ name: 'agentEdit', params: { id: item.agent_id } }"
        >
          {{ item.agent_id }}
        </router-link>
      </template>
      <template #item.input="{ item }">
        <span>{{ truncateMessage(item.input) }}</span>
      </template>
      <template #item.task_name="{ item }">
        <span>{{
          item.module_name == null ? item.task_name : item.module_name
        }}</span>
      </template>
      <template #item.updated_at="{ item }">
        <date-time-display :timestamp="item.updated_at" />
      </template>
      <template #item.tags="{ item }">
        <tag-viewer
          :tags="item.tags"
          @update-tag="updateTag(item, ...arguments)"
          @delete-tag="deleteTag(item, ...arguments)"
          @new-tag="addTag(item, ...arguments)"
        />
      </template>
      <template #item.actions="{ item }">
        <v-menu offset-y>
          <template #activator="{ on, attrs }">
            <v-btn text icon x-small v-bind="attrs" v-on="on">
              <v-icon>fa-ellipsis-v</v-icon>
            </v-btn>
          </template>
          <v-list class="ml-2 mr-2">
            <v-subheader>Execution</v-subheader>
            <v-list-item
              v-show="supportsRerun(item)"
              key="rerunTask"
              link
              @click="rerunTask(item)"
            >
              <v-list-item-title>
                <v-icon small>fa-redo</v-icon>
                Rerun Task
              </v-list-item-title>
            </v-list-item>
            <v-list-item key="stopTask" link @click="stopTask(item)">
              <v-list-item-title>
                <v-icon small>fa-stop</v-icon>
                Stop Task
              </v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-subheader>Input</v-subheader>
            <v-list-item key="clipboardInput" link @click="copyInput(item)">
              <v-list-item-title>
                <v-icon small>fa-paperclip</v-icon>
                Copy to Clipboard
              </v-list-item-title>
            </v-list-item>
            <v-list-item key="downloadInput" link @click="downloadInput(item)">
              <v-list-item-title>
                <v-icon small>fa-download</v-icon>
                Download
              </v-list-item-title>
            </v-list-item>
            <v-divider v-if="hasOutput(item)" />
            <v-subheader v-if="hasOutput(item)">Output</v-subheader>
            <v-list-item
              v-if="hasOutput(item)"
              key="clipboardOutput"
              link
              @click="copyOutput(item)"
            >
              <v-list-item-title>
                <v-icon small>fa-paperclip</v-icon>
                Copy to Clipboard
              </v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="hasOutput(item)"
              key="downloadOutput"
              link
              @click="downloadOutput(item)"
            >
              <v-list-item-title>
                <v-icon small>fa-download</v-icon>
                Download
              </v-list-item-title>
            </v-list-item>
            <v-divider v-if="item.downloads.length > 0" />
            <v-subheader v-if="item.downloads.length > 0">Files</v-subheader>
            <v-list-item
              v-for="download in item.downloads"
              :key="'download-' + download.id"
              link
              @click="downloadFile(download)"
            >
              <v-list-item-title title="Download file">
                <v-icon small>fa-download</v-icon>
                {{ download.filename }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import Vue from "vue";
import moment from "moment";
import debounce from "lodash.debounce";
// eslint-disable-next-line import/no-named-default
import { default as AnsiUp } from "ansi_up";
import DateTimeDisplay from "@/components/DateTimeDisplay.vue";
import TooltipButton from "@/components/TooltipButton.vue";
import TagViewer from "@/components/TagViewer.vue";
import HeaderMenu from "@/components/HeaderMenu.vue";
import DownloadMixin from "@/mixins/download-stager";
import { useApplicationStore } from "@/stores/application-module";
import * as downloadApi from "@/api/download-api";
import * as agentTaskApi from "@/api/agent-task-api";
import * as moduleApi from "@/api/module-api";

export default {
  name: "AgentTasksTable",
  components: {
    DateTimeDisplay,
    TagViewer,
    TooltipButton,
    HeaderMenu,
  },
  mixins: [DownloadMixin],
  props: {
    agent: {
      type: Object,
      required: false,
      default: null,
    },
    refreshTasks: {
      type: Boolean,
      default: false,
    },
    hideColumns: {
      type: Array,
      default: () => [],
    },
    selectedAgents: {
      type: Array,
      default: () => [],
    },
    selectedUsers: {
      type: Array,
      default: () => [],
    },
    selectedTags: {
      type: Array,
      default: () => [],
    },
    search: {
      type: String,
      default: "",
    },
    noFilters: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      tasks: [],
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10,
      loading: false,
      moment,
      sortBy: "updated_at",
      sortDesc: true,
      refreshInterval: null,
      expandedTasks: {},
      debouncedGetTasks: debounce(this.getTasks, 500),
      selectedHeadersTemp: [],
      headersFull: [
        {
          text: "Task ID",
          value: "id",
          sortable: true,
          defaultHeader: false,
          alwaysShow: false,
          align: "center",
          order: 1,
        },
        {
          text: "Status",
          value: "status",
          sortable: true,
          defaultHeader: true,
          order: 2,
        },
        {
          text: "Task Input",
          value: "input",
          sortable: false,
          defaultHeader: false,
          order: 4,
        },
        {
          text: "Task Name",
          value: "task_name",
          sortable: false,
          defaultHeader: true,
          order: 3,
        },
        {
          text: "Agent",
          value: "agent_id",
          sortable: true,
          defaultHeader: true,
          order: 5,
        },
        {
          text: "User",
          value: "username",
          sortable: false,
          defaultHeader: true,
          order: 6,
        },
        {
          text: "Updated At",
          value: "updated_at",
          sortable: true,
          defaultHeader: true,
          order: 7,
        },
        {
          text: "Tags",
          value: "tags",
          sortable: false,
          width: 400,
          defaultHeader: true,
          order: 8,
        },
        {
          text: "Actions",
          value: "actions",
          sortable: false,
          defaultHeader: true,
          alwaysShow: true,
          order: 9,
        },
      ],
    };
  },
  computed: {
    applicationStore() {
      return useApplicationStore();
    },
    headers() {
      return this.headersFull
        .filter(
          (h) =>
            this.applicationStore.taskHeaders.findIndex(
              (h2) => h2.text === h.text,
            ) > -1,
        )
        .sort((a, b) => a.order - b.order);
    },
  },
  watch: {
    refreshTasks: {
      handler(newVal) {
        if (newVal) {
          if (this.debouncedGetTasks) {
            this.debouncedGetTasks();
          } else {
            this.getTasks();
          }
          this.refreshInterval = setInterval(() => {
            this.debouncedGetTasks();
          }, 8000);
        } else {
          clearInterval(this.refreshInterval);
        }
      },
      immediate: true,
    },
    currentPage() {
      this.debouncedGetTasks();
    },
    agent() {
      this.debouncedGetTasks();
    },
    selectedAgents() {
      this.debouncedGetTasks();
    },
    selectedUsers() {
      this.debouncedGetTasks();
    },
    selectedTags() {
      this.debouncedGetTasks();
    },
    search() {
      this.debouncedGetTasks();
    },
  },
  async mounted() {
    this.debouncedGetTasks();
    if (this.applicationStore.taskHeaders.length === 0) {
      this.applicationStore.taskHeaders = this.headersFull.filter(
        (h) => h.defaultHeader === true,
      );
    }
    this.selectedHeadersTemp = this.headersFull.filter((h) =>
      this.applicationStore.taskHeaders.some((h2) => h2.text === h.text),
    );
  },
  beforeDestroy() {
    clearInterval(this.refreshInterval);
  },
  methods: {
    submitHeaderForm(val) {
      this.selectedHeadersTemp = val;
      this.applicationStore.taskHeaders = [...this.selectedHeadersTemp];
    },
    resetHeaders() {
      this.applicationStore.taskHeaders = this.headersFull.filter(
        (h) => h.defaultHeader === true,
      );
      this.selectedHeadersTemp = this.headersFull.filter((h) =>
        this.applicationStore.taskHeaders.some((h2) => h2.text === h.text),
      );
    },
    // eslint-disable-next-line no-unused-vars
    // from https://github.com/xpl/ansicolor
    stripAnsi(text) {
      return text.replace(
        // eslint-disable-next-line no-control-regex
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g,
        "",
      ); // hope V8 caches the regexp
    },
    isAnsi(output) {
      return this.stripAnsi(output) !== output;
    },
    ansiToHtml(output) {
      return new AnsiUp().ansi_to_html(output);
    },
    deleteTag(task, tag) {
      agentTaskApi
        .deleteTag(task.agent_id, task.id, tag.id)
        .then(() => {
          this.$set(
            task,
            "tags",
            task.tags.filter((t) => t.id !== tag.id),
          );
          this.$emit("refresh-tags");
        })
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    updateTag(task, tag) {
      agentTaskApi
        .updateTag(task.agent_id, task.id, tag)
        .then((t) => {
          const index = task.tags.findIndex((x) => x.id === t.id);
          task.tags.splice(index, 1, t);
          this.$emit("refresh-tags");
          this.$snack.success("Tag updated");
        })
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    addBlankLines(text) {
      return `\n${text}\n`;
    },
    addTag(task, tag) {
      agentTaskApi
        .addTag(task.agent_id, task.id, tag)
        .then((t) => {
          this.$set(task, "tags", [...task.tags, t]);
          this.$emit("refresh-tags");
        })
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    truncateMessage(task) {
      if (task) {
        return task.length > 30 ? `${task.substr(0, 30)}...` : task;
      }
      return "";
    },
    updateTaskBackgroundColor(task) {
      if (task.backgroundColor === "black") {
        task.backgroundColor = "white";
      } else {
        task.backgroundColor = "black";
      }
      this.expandedTasks[task.uniqueId].backgroundColor = task.backgroundColor;

      // Need to call vue set to trigger reactivity on the table
      Vue.set(this.tasks, this.tasks.indexOf(task), task);
    },
    isDownload(task) {
      return task.downloads && task.downloads.length > 0;
    },
    downloadFile(download) {
      downloadApi.getDownload(download.id);
    },
    hasOutput(task) {
      return !!task.output;
    },
    async downloadInput(task) {
      if (task.input) {
        if (!this.expandedTasks[task.uniqueId]?.full_input) {
          const data = await agentTaskApi.getTask(task.agent_id, task.id);
          Vue.set(this.expandedTasks, task.uniqueId, {
            ...this.expandedTasks[task.uniqueId],
            ...data,
          });
        }

        this.downloadText(
          this.expandedTasks[task.uniqueId].full_input,
          `${task.uniqueId}-input.txt`,
        );
      }
    },
    downloadOutput(task) {
      if (task.output) {
        this.downloadText(task.output, `${task.uniqueId}-output.txt`);
      }
    },
    async copyInput(task) {
      if (task.input) {
        if (!this.expandedTasks[task.uniqueId]?.full_input) {
          const data = await agentTaskApi.getTask(task.agent_id, task.id);
          Vue.set(this.expandedTasks, task.uniqueId, {
            ...this.expandedTasks[task.uniqueId],
            ...data,
          });
        }

        try {
          navigator.clipboard.writeText(
            this.expandedTasks[task.uniqueId].full_input,
          );
        } catch (error) {
          this.$snack.warn(
            "Failed to copy to clipboard. You must be on HTTPS or localhost.",
          );
        }
      }
    },
    copyOutput(task) {
      if (task.output) {
        try {
          navigator.clipboard.writeText(task.output);
        } catch (error) {
          this.$snack.warn(
            "Failed to copy to clipboard. You must be on HTTPS or localhost.",
          );
        }
      }
    },
    imageData(task, download) {
      const expandedDownloads = this.expandedTasks[task.uniqueId]?.downloads;
      if (expandedDownloads) {
        const found = expandedDownloads.find((d) => d.id === download.id);
        if (found) {
          return found.image;
        }
      }
      return null;
    },
    async getImagesForTask(task) {
      if (!this.expandedTasks[task.uniqueId].imagesRetrieved) {
        const data = await agentTaskApi.getTask(task.agent_id, task.id);
        Vue.set(this.expandedTasks, task.uniqueId, {
          ...this.expandedTasks[task.uniqueId],
          ...data,
          imagesRetrieved: true,
        });
      }

      for (let i = 0; i < task.downloads.length; i++) {
        const download = task.downloads[i];
        if (
          !this.expandedTasks[task.uniqueId].downloads[download.id]?.image &&
          download.filename.match(/[^/]+(jpg|jpeg|png|gif)$/)
        ) {
          // eslint-disable-next-line
          const url = await downloadApi.getDownloadAsUrl(download.id);
          this.expandedTasks[task.uniqueId].downloads[i].image = url;
        }
      }
      Vue.set(this.tasks, this.tasks.indexOf(task), task);
    },
    async toggleSeeFullInput(task) {
      if (!task.expandedInput) {
        const data = await agentTaskApi.getTask(task.agent_id, task.id);
        Vue.set(this.expandedTasks, task.uniqueId, {
          ...this.expandedTasks[task.uniqueId],
          ...data,
          expandedInput: true,
        });
        task.expandedInput = true;
      } else {
        this.expandedTasks[task.uniqueId].expandedInput = false;
        task.expandedInput = false;
      }

      // Need to call vue set to trigger reactivity on the table
      Vue.set(this.tasks, this.tasks.indexOf(task), task);
    },
    async handleItemExpanded({ item, value }) {
      if (value && !this.expandedTasks[item.uniqueId].fullTaskLoaded) {
        const data = await agentTaskApi.getTask(item.agent_id, item.id);
        Vue.set(this.expandedTasks, item.uniqueId, {
          ...this.expandedTasks[item.uniqueId],
          ...data,
          fullTaskLoaded: true,
        });
        // Need to call vue set to trigger reactivity on the table
        Vue.set(this.tasks, this.tasks.indexOf(item), item);
      }
    },
    async rerunTask(task) {
      try {
        const fullTask = await agentTaskApi.getTask(task.agent_id, task.id);
        if (fullTask.module_name) {
          const options = {
            ...(fullTask.options || {}),
            Agent: fullTask.agent_id,
          };
          await moduleApi.executeModule(fullTask.module_name, options);
          this.$snack.info(`Module ${fullTask.module_name} rerun queued.`);
        } else if (fullTask.task_name === "TASK_SHELL") {
          await agentTaskApi.shell(fullTask.agent_id, fullTask.full_input);
          this.$snack.info("Shell command rerun queued.");
        } else if (fullTask.task_name === "TASK_SYSINFO") {
          await agentTaskApi.sysinfo(fullTask.agent_id);
          this.$snack.info("Sysinfo task rerun queued.");
        } else {
          this.$snack.error(
            `Rerunning ${fullTask.task_name} is not supported.`,
          );
        }
      } catch (err) {
        this.$snack.error(`Error rerunning task: ${err}`);
      }
    },
    supportsRerun(item) {
      if (item.module_name) {
        return true;
      }
      if (
        item.task_name === "shell" ||
        item.task_name === "TASK_SHELL" ||
        item.task_name === "sysinfo" ||
        item.task_name === "TASK_SYSINFO"
      ) {
        return true;
      }
      return false;
    },
    async stopTask(task) {
      try {
        await agentTaskApi.stopTask(task.agent_id, task.id);
        this.$snack.success(`Task ${task.id} stop queued.`);
      } catch (err) {
        this.$snack.error(`Error stopping task: ${err}`);
      }
    },
    handlePageChange() {
      this.debouncedGetTasks();
    },
    handleOptionsChange(value) {
      this.currentPage = value.page;
      this.itemsPerPage = value.itemsPerPage;

      if (value.sortBy.length > 0) {
        this.sortBy = value.sortBy[0];
        this.sortDesc = value.sortDesc[0];
      } else {
        this.sortBy = "id";
        this.sortDesc = true;
      }
      this.debouncedGetTasks();
    },
    async getTasks() {
      if (
        !this.noFilters &&
        (this.selectedAgents.length === 0 || this.selectedUsers.length === 0)
      ) {
        // seems weird to do this but it would be weirder to select all agents
        // when no agents are selected. Even though the api sees no agents as all agents.
        this.tasks = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalItems = 0;
        return;
      }
      this.loading = true;
      let agents = null;
      if (this.selectedAgents.length > 0) {
        agents = this.selectedAgents;
      }
      const response = await agentTaskApi.getTasks(agents, {
        page: this.currentPage,
        limit: this.itemsPerPage,
        sortBy: this.sortBy,
        sortOrder: this.sortDesc ? "desc" : "asc",
        users: this.selectedUsers,
        tags: this.selectedTags,
        search: this.search,
      });
      this.currentPage = response.page;
      this.totalPages = response.total_pages;
      this.totalItems = response.total;

      // iterate response.records and add expandedInput if it exists in expandedTasks
      // this ensures that the expandedInput doesn't get wiped away after a refresh
      this.tasks = response.records.map((task) => {
        task.uniqueId = `${task.agent_id}-${task.id}`;

        if (!this.expandedTasks[task.uniqueId]) {
          Vue.set(this.expandedTasks, task.uniqueId, {});
        }

        if (this.expandedTasks[task.uniqueId].expandedInput) {
          task.expandedInput = true;
        }

        this.expandedTasks[task.uniqueId].backgroundColor =
          this.expandedTasks[task.uniqueId].backgroundColor || "black";
        task.backgroundColor =
          this.expandedTasks[task.uniqueId].backgroundColor;

        if (this.isAnsi(task.output || "")) {
          this.expandedTasks[task.uniqueId].htmlOutput = this.ansiToHtml(
            task.output,
          );
        }

        return task;
      });

      this.loading = false;
    },
  },
};
</script>

<style>
.mono {
  white-space: pre-wrap;
  font:
    1.1em "Andale Mono",
    Consolas,
    "Courier New";
  font-weight: bold;
  line-height: 1.6em;
  text-align: left;
}

.font-white {
  color: white;
}

.font-black {
  color: black;
}
</style>
