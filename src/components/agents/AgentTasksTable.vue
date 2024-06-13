<template>
  <div>
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
      @update:options="handleOptionsChange"
    >
      <template #expanded-item="{ headers: scopedHeaders, item }">
        <td :colspan="scopedHeaders.length">
          <div>
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
              "
            >
              <div>
                <tooltip-button
                  :icon="item.expandedInput ? 'fa-minus' : 'fa-plus'"
                  text="See Full Input"
                  x-small
                  @click="toggleSeeFullInput(item)"
                />
                <span v-if="item.expandedInput">Showing full input</span>
              </div>
              <v-switch
                v-model="expandedTasks[item.uniqueId].backgroundColor"
                false-value="white"
                true-value="black"
                label="Dark Background"
                @change="updateTaskBackgroundColor(item)"
              />
            </div>
            <p><b>Task Input:</b></p>
            <p
              :class="
                'mono ' +
                (expandedTasks[item.uniqueId].backgroundColor === 'white'
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
            </p>
            <p><b>Task Output:</b></p>
            <div
              v-if="
                item.downloads.length > 0 &&
                item.downloads.some((d) =>
                  d.filename.match(/[^/]+(jpg|jpeg|png|gif)$/),
                )
              "
            >
              <v-btn text x-small @click="getImagesForTask(item)">
                View Images
              </v-btn>
              <div>
                <v-img
                  v-for="download in item.downloads"
                  :key="download.id"
                  :src="imageData(item, download)"
                  :alt="download.filename"
                  :max-width="700"
                  contain
                />
              </div>
            </div>
            <div
              :class="
                'mono ' +
                (expandedTasks[item.uniqueId].backgroundColor === 'white'
                  ? 'font-black'
                  : 'font-white')
              "
              :style="
                'background-color: ' +
                expandedTasks[item.uniqueId].backgroundColor +
                ';'
              "
            >
              <!-- TODO Option for original output -->
              <!-- eslint-disable vue/no-v-html -->
              <div
                v-if="expandedTasks[item.uniqueId].htmlOutput"
                v-html="expandedTasks[item.uniqueId].htmlOutput"
              />
              <div v-else>
                {{ addBlankLines(item.output) }}
              </div>
            </div>
          </div>
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
            <v-list-item key="downloadInput" link @click="downloadInput(item)">
              <v-list-item-title>
                <v-icon>fa-download</v-icon>
                Download Input
              </v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="hasOutput(item)"
              key="downloadOutput"
              link
              @click="downloadOutput(item)"
            >
              <v-list-item-title>
                <v-icon>fa-download</v-icon>
                Download Output
              </v-list-item-title>
            </v-list-item>
            <v-list-item key="clipboardInput" link @click="copyInput(item)">
              <v-list-item-title>
                <v-icon>fa-paperclip</v-icon>
                Copy Input to Clipboard
              </v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="hasOutput(item)"
              key="clipboardOutput"
              link
              @click="copyOutput(item)"
            >
              <v-list-item-title>
                <v-icon>fa-paperclip</v-icon>
                Copy Output to Clipboard
              </v-list-item-title>
            </v-list-item>
            <v-spacer />
            <v-list-item
              v-for="download in item.downloads"
              :key="'download-' + download.id"
              link
              @click="downloadFile(download)"
            >
              <v-list-item-title>
                <v-icon>fa-download</v-icon>
                Download {{ download.filename }}
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
import DownloadMixin from "@/mixins/download-stager";
import * as downloadApi from "@/api/download-api";
import * as agentTaskApi from "@/api/agent-task-api";

export default {
  name: "AgentTasksTable",
  components: {
    DateTimeDisplay,
    TagViewer,
    TooltipButton,
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
    };
  },
  computed: {
    headers() {
      return [
        { text: "Task ID", value: "id", sortable: true },
        { text: "Status", value: "status", sortable: true },
        { text: "Agent", value: "agent_id", sortable: true },
        { text: "Task Input", value: "input", sortable: false },
        { text: "Task Name", value: "task_name", sortable: false },
        { text: "User", value: "username", sortable: false },
        { text: "Updated At", value: "updated_at", sortable: true },
        {
          text: "Tags",
          value: "tags",
          sortable: false,
          width: 400,
        },
        { text: "Actions", value: "actions", sortable: false },
      ].filter((h) => !this.hideColumns.includes(h.value));
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
  },
  beforeDestroy() {
    clearInterval(this.refreshInterval);
  },
  methods: {
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
          this.expandedTasks[task.uniqueId] = {
            ...this.expandedTasks[task.uniqueId],
            ...data,
          };
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
          this.expandedTasks[task.uniqueId] = {
            ...this.expandedTasks[task.uniqueId],
            ...data,
          };
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
        this.expandedTasks[task.uniqueId] = {
          ...this.expandedTasks[task.uniqueId],
          ...data,
        };
        this.expandedTasks[task.uniqueId].imagesRetrieved = true;
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
        this.expandedTasks[task.uniqueId] = {
          ...this.expandedTasks[task.uniqueId],
          ...data,
          expandedInput: true,
        };
        task.expandedInput = true;
      } else {
        this.expandedTasks[task.uniqueId].expandedInput = false;
        task.expandedInput = false;
      }

      // Need to call vue set to trigger reactivity on the table
      Vue.set(this.tasks, this.tasks.indexOf(task), task);
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
          this.expandedTasks[task.uniqueId] = {};
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

      this.tasks = response.records;
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
