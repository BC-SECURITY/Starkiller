<template>
  <div>
    <div style="display: flex; flix-direction: row;">
      <v-card
        class="mr-2 pa-2"
        elevation="2"
        outlined
        style="width:300px;"
      >
        <v-expansion-panels
          class="mb-6"
          multiple
        >
          <v-expansion-panel>
            <v-expansion-panel-header expand-icon="mdi-menu-down">
              Search
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-text-field
                v-model="search"
                label="Search"
                outlined
                dense
                required
                @input="debouncedHandleSearch"
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
      <v-card
        style="flex-grow: 1;"
        elevation="2"
        outlined
      >
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
          <template #expanded-item="{ headers, item }">
            <td :colspan="headers.length">
              <div>
                <div class="pt-2">
                  <tooltip-button
                    :icon="item.expandedInput ? 'fa-minus' : 'fa-plus'"
                    text="See Full Input"
                    x-small
                    @click="toggleSeeFullInput(item)"
                  />
                </div>
                <p><b>Task Input:</b></p>
                <p
                  class="mono"
                  style="max-width: 900px"
                >
                  {{ item.expandedInput ? expandedTasks[item.id].full_input : item.input }}
                </p>
                <p><b>Task Output:</b></p>
                <div
                  v-if="item.downloads.length > 0
                    && item.downloads.some(d => d.filename.match(/[^/]+(jpg|jpeg|png|gif)$/))"
                >
                  <v-btn
                    text
                    x-small
                    @click="getImagesForTask(item)"
                  >
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
                <p
                  class="mono"
                  style="max-width: 900px"
                >
                  <!-- TODO Option for original output -->
                  {{ item.output }}
                </p>
              </div>
            </td>
          </template>
          <template #item.status="{ item }">
            <v-icon
              v-if="item.status === 'pulled'"
              color="green"
              small
            >
              fa-check-square
            </v-icon>
            <v-icon
              v-else-if="item.status === 'queued'"
              color="orange"
              small
            >
              fa-clock
            </v-icon>
          </template>
          <template #item.input="{ item }">
            <span>{{ truncateMessage(item.input) }}</span>
          </template>
          <template #item.task_name="{ item }">
            <span>{{ item.module_name == null ? item.task_name : item.module_name }}</span>
          </template>
          <template #item.updated_at="{ item }">
            <v-tooltip top>
              <template #activator="{ on }">
                <span v-on="on">{{ moment(item.updated_at).fromNow() }}</span>
              </template>
              <span>{{ moment(item.updated_at).format('MMM D YYYY, h:mm:ss a') }}</span>
            </v-tooltip>
          </template>
          <template #item.actions="{ item }">
            <v-menu offset-y>
              <template #activator="{ on, attrs }">
                <v-btn
                  text
                  icon
                  x-small
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon>fa-ellipsis-v</v-icon>
                </v-btn>
              </template>
              <v-list class="ml-2 mr-2">
                <v-list-item
                  key="downloadInput"
                  link
                  @click="downloadInput(item)"
                >
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
                <v-list-item
                  key="clipboardInput"
                  link
                  @click="copyInput(item)"
                >
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
      </v-card>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import debounce from 'lodash.debounce';

import TooltipButton from '@/components/TooltipButton.vue';
import DownloadMixin from '@/mixins/download-stager';
import * as downloadApi from '@/api/download-api';
import * as agentApi from '@/api/agent-api';
import Vue from 'vue';

export default {
  name: 'AgentCommandHistory',
  components: {
    TooltipButton,
  },
  mixins: [DownloadMixin],
  props: {
    agent: {
      type: Object,
      required: true,
    },
    refreshTasks: {
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
      search: '',
      loading: false,
      moment,
      sortBy: 'id',
      sortDesc: true,
      refreshInterval: null,
      expandedTasks: {},
      debouncedHandleSearch: () => {},
      headers: [
        { text: 'Task ID', value: 'id', sortable: true },
        { text: 'Status', value: 'status', sortable: true },
        { text: 'Task Input', value: 'input', sortable: false },
        { text: 'Task Name', value: 'task_name', sortable: false },
        { text: 'User', value: 'username', sortable: false },
        { text: 'Updated At', value: 'updated_at', sortable: true },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
    };
  },
  watch: {
    refreshTasks(newVal) {
      if (newVal) {
        this.getTasks();
        this.refreshInterval = setInterval(() => {
          this.getTasks();
        }, 8000);
      } else {
        clearInterval(this.refreshInterval);
      }
    },
    agent: {
      handler() {
        this.initialize();
      },
    },
  },
  async mounted() {
    if (this.agent) {
      this.initialize();
    }

    this.debouncedHandleSearch = debounce(this.handleSearch, 500);
  },
  beforeDestroy() {
    clearInterval(this.refreshInterval);
  },
  methods: {
    initialize() {
      this.getTasks();
    },
    truncateMessage(task) {
      if (task) {
        return task.length > 30 ? `${task.substr(0, 30)}...` : task;
      }
      return '';
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
        if (!this.expandedTasks[task.id]) {
          const data = await agentApi.getTask(this.agent.session_id, task.id);
          this.expandedTasks[task.id] = data;
        }

        this.downloadText(this.expandedTasks[task.id].full_input, `${task.agent_id}-${task.id}-input.txt`);
      }
    },
    downloadOutput(task) {
      if (task.output) {
        this.downloadText(task.output, `${task.agent_id}-${task.id}-output.txt`);
      }
    },
    async copyInput(task) {
      if (task.input) {
        if (!this.expandedTasks[task.id]) {
          const data = await agentApi.getTask(this.agent.session_id, task.id);
          this.expandedTasks[task.id] = data;
        }

        try {
          navigator.clipboard.writeText(this.expandedTasks[task.id].full_input);
        } catch (error) {
          this.$snack.warn('Failed to copy to clipboard. You must be on HTTPS or localhost.');
        }
      }
    },
    copyOutput(task) {
      if (task.output) {
        try {
          navigator.clipboard.writeText(task.output);
        } catch (error) {
          this.$snack.warn('Failed to copy to clipboard. You must be on HTTPS or localhost.');
        }
      }
    },
    imageData(task, download) {
      const expandedDownloads = this.expandedTasks[task.id]?.downloads;
      if (expandedDownloads) {
        const found = expandedDownloads.find((d) => d.id === download.id);
        if (found) {
          return found.image;
        }
      }
      return null;
    },
    async getImagesForTask(task) {
      if (!this.expandedTasks[task.id]) {
        const data = await agentApi.getTask(this.agent.session_id, task.id);
        this.expandedTasks[task.id] = data;
      }

      for (let i = 0; i < task.downloads.length; i++) {
        const download = task.downloads[i];
        if (!this.expandedTasks[task.id].downloads[download.id]?.image
          && download.filename.match(/[^/]+(jpg|jpeg|png|gif)$/)) {
          // eslint-disable-next-line
          const url = await downloadApi.getDownloadAsUrl(download.id);
          this.expandedTasks[task.id].downloads[i].image = url;
        }
      }
      Vue.set(this.tasks, this.tasks.indexOf(task), task);
    },
    async toggleSeeFullInput(task) {
      if (!this.expandedTasks[task.id]) {
        const data = await agentApi.getTask(this.agent.session_id, task.id);
        this.expandedTasks[task.id] = data;
        task.expandedInput = true;
      } else {
        task.expandedInput = !task.expandedInput;
      }
      Vue.set(this.tasks, this.tasks.indexOf(task), task);
    },
    async getTasks() {
      // eslint-disable-next-line camelcase
      if (!this.agent?.session_id) return;
      this.loading = true;
      const response = await agentApi.getTasks(this.agent.session_id, {
        page: this.currentPage,
        limit: this.itemsPerPage,
        sortBy: this.sortBy,
        sortOrder: this.sortDesc ? 'desc' : 'asc',
        search: this.search,
      });
      this.currentPage = response.page;
      this.totalPages = response.total_pages;
      this.totalItems = response.total;

      // iterate response.records and add expandedInput if it exists in expandedTasks
      // this ensures that the expandedInput doesn't get wiped away after a refresh
      this.tasks = response.records.map((task) => {
        task.uniqueId = `${task.agent_id}-${task.id}`;
        if (this.expandedTasks[task.id]) {
          task.expandedInput = true;
        }
        return task;
      });

      this.tasks = response.records;
      this.loading = false;
    },
    handleSearch() {
      this.getTasks();
    },
    handlePageChange(page) {
      this.currentPage = page;
      this.getTasks();
    },
    handleOptionsChange(value) {
      this.currentPage = value.page;
      this.itemsPerPage = value.itemsPerPage;

      if (value.sortBy.length > 0) {
        // eslint-disable-next-line prefer-destructuring
        this.sortBy = value.sortBy[0];
        // eslint-disable-next-line prefer-destructuring
        this.sortDesc = value.sortDesc[0];
      } else {
        this.sortBy = 'id';
        this.sortDesc = true;
      }
      this.getTasks();
    },
  },
};
</script>

<style>
.mono {
  white-space: pre-wrap;
  font: 0.8em 'Andale Mono', Consolas, 'Courier New';
  line-height: 1.6em;
}
</style>
