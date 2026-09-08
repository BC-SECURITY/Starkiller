<template>
  <div>
    <div
      class="ml-3 mr-3 align-center"
      style="display: flex; flex-direction: row-reverse"
    >
      <div style="height: 40px" />
      <header-menu
        :headers-full="headersForMenu"
        :initial-selected-headers="selectedHeadersTemp"
        :default-headers="headersFull.filter((h) => h.defaultHeader === true)"
        @submit="submitHeaderForm"
      />
    </div>
    <v-data-table-server
      v-model:sort-by="sortBy"
      v-model:items-per-page="itemsPerPage"
      v-model:page="currentPage"
      :headers="headers"
      :items="tasks"
      item-value="uniqueId"
      :items-length="totalItems"
      :items-per-page-options="[10, 25, 50, 100]"
      :loading="loading"
      show-expand
      @update:expanded="handleItemExpanded"
      @update:options="handleOptionsChange"
    >
      <template #expanded-row="{ columns, item }">
        <td :colspan="columns.length" class="pa-4">
          <v-card flat>
            <div class="task-detail-header px-4 py-2">
              <!-- Row 1: identity line (Task #, name chip) + Dark Mode switch -->
              <div class="d-flex align-center ga-2">
                <span class="font-weight-bold">Task #{{ item.id }}</span>
                <!-- Keep this chip's content a single text node — the ellipsis
                     CSS for .task-name-chip (in src/app.scss) breaks if you add
                     an icon or wrapper span here. The v-tooltip wraps the chip
                     from the outside (the codebase-standard pattern, unlike a
                     native :title), so the single-text-node content is intact. -->
                <v-tooltip
                  v-if="item.module_name || item.task_name"
                  location="top"
                >
                  <template #activator="{ props: activatorProps }">
                    <v-chip
                      v-bind="activatorProps"
                      size="small"
                      class="task-name-chip"
                      color="primary"
                      variant="outlined"
                    >
                      {{ item.module_name || item.task_name }}
                    </v-chip>
                  </template>
                  {{ item.module_name || item.task_name }}
                </v-tooltip>
                <v-spacer />
                <v-switch
                  v-model="expandedTasks[item.uniqueId].backgroundColor"
                  color="primary"
                  false-value="white"
                  true-value="black"
                  label="Dark Mode Output"
                  hide-details
                  class="mt-0 pt-0 flex-shrink-0"
                  @update:model-value="updateTaskBackgroundColor(item)"
                />
              </div>
              <!-- Row 2: options line, full width (chips wrap) -->
              <div
                v-if="
                  (expandedTasks[item.uniqueId].options &&
                    Object.keys(expandedTasks[item.uniqueId].options).length >
                      0) ||
                  (expandedTasks[item.uniqueId].module_options &&
                    Object.keys(expandedTasks[item.uniqueId].module_options)
                      .length > 0)
                "
                class="d-flex flex-wrap align-center ga-2 mt-2"
              >
                <span class="task-options-label font-weight-bold"
                  >Options:</span
                >
                <v-chip
                  v-for="(value, key) in expandedTasks[item.uniqueId].options ||
                  expandedTasks[item.uniqueId].module_options"
                  :key="key"
                  size="small"
                  label
                >
                  <span class="font-weight-bold mr-1">{{ key }}:</span>
                  <span>{{ truncateOption(value) }}</span>
                </v-chip>
              </div>
            </div>
            <v-divider />

            <v-card-text>
              <v-row density="compact">
                <v-col cols="12">
                  <div class="mb-4">
                    <div class="d-flex align-center mb-1">
                      <span class="text-subtitle-2 font-weight-bold"
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
                      <span class="text-subtitle-2 font-weight-bold"
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
                        variant="text"
                        size="x-small"
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
                      <div class="d-flex flex-wrap ga-2 mb-2">
                        <v-img
                          v-for="download in item.downloads"
                          :key="download.id"
                          :src="imageData(item, download)"
                          :alt="download.filename"
                          :max-width="400"
                          class="bg-grey-lighten-2 rounded mb-2"
                          contain
                        >
                          <template #placeholder>
                            <v-row
                              class="fill-height ma-0 align-center justify-center"
                            >
                              <v-progress-circular
                                indeterminate
                                color="grey-lighten-5"
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
        <v-icon
          v-if="item.status === config.inProgressStatus"
          color="blue"
          size="small"
        >
          fa-check-square
        </v-icon>
        <v-icon
          v-else-if="item.status === 'queued'"
          color="orange"
          size="small"
        >
          fa-clock
        </v-icon>
        <v-icon
          v-else-if="item.status === 'completed'"
          color="green"
          size="small"
        >
          fa-check-circle
        </v-icon>
        <v-icon v-else-if="item.status === 'error'" color="red" size="small">
          fa-times-circle
        </v-icon>
        <v-icon
          v-else-if="item.status === 'continuous'"
          color="purple"
          size="small"
        >
          fa-infinity
        </v-icon>
      </template>
      <!-- Renders the entity id as a router-link only in list mode
           (no `entity` prop passed in); the slot name is per-entity via
           config.idField (e.g. "item.agent_id" / "item.plugin_id"). -->
      <template v-if="!entity" #[`item.${config.idField}`]="{ item }">
        <router-link
          style="color: inherit"
          :to="{ name: config.routeName, params: { id: item[config.idField] } }"
        >
          {{ item[config.idField] }}
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
          @attach-tag="addTag(item, $event)"
          @detach-tag="deleteTag(item, $event)"
        />
      </template>
      <template #item.actions="{ item }">
        <v-menu>
          <template #activator="{ props: activatorProps }">
            <v-btn variant="text" icon size="x-small" v-bind="activatorProps">
              <v-icon>fa-ellipsis-v</v-icon>
            </v-btn>
          </template>
          <v-list class="ml-2 mr-2">
            <v-list-subheader>Execution</v-list-subheader>
            <v-list-item
              v-show="supportsRerun(item)"
              key="rerunTask"
              link
              @click="rerunTask(item)"
            >
              <v-list-item-title>
                <v-icon size="small">fa-redo</v-icon>
                Rerun Task
              </v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="config.canStop"
              key="stopTask"
              link
              @click="stopTask(item)"
            >
              <v-list-item-title>
                <v-icon size="small">fa-stop</v-icon>
                Stop Task
              </v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-subheader>Input</v-list-subheader>
            <v-list-item key="clipboardInput" link @click="copyInput(item)">
              <v-list-item-title>
                <v-icon size="small">fa-paperclip</v-icon>
                Copy to Clipboard
              </v-list-item-title>
            </v-list-item>
            <v-list-item key="downloadInput" link @click="downloadInput(item)">
              <v-list-item-title>
                <v-icon size="small">fa-download</v-icon>
                Download
              </v-list-item-title>
            </v-list-item>
            <v-divider v-if="hasOutput(item)" />
            <v-list-subheader v-if="hasOutput(item)">Output</v-list-subheader>
            <v-list-item
              v-if="hasOutput(item)"
              key="clipboardOutput"
              link
              @click="copyOutput(item)"
            >
              <v-list-item-title>
                <v-icon size="small">fa-paperclip</v-icon>
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
                <v-icon size="small">fa-download</v-icon>
                Download
              </v-list-item-title>
            </v-list-item>
            <v-divider v-if="item.downloads.length > 0" />
            <v-list-subheader v-if="item.downloads.length > 0"
              >Files</v-list-subheader
            >
            <v-list-item
              v-for="download in item.downloads"
              :key="'download-' + download.id"
              link
              @click="downloadFile(download)"
            >
              <v-list-item-title title="Download file">
                <v-icon size="small">fa-download</v-icon>
                {{ download.filename }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table-server>
  </div>
</template>

<script>
import { getCurrentInstance } from "vue";
import debounce from "lodash.debounce";
import { isAnsi, ansiToHtml } from "@/utils/ansi";
import { useAutoRefresh } from "@/composables/useAutoRefresh";
import DateTimeDisplay from "@/components/DateTimeDisplay.vue";
import TooltipButton from "@/components/TooltipButton.vue";
import TagViewer from "@/components/TagViewer.vue";
import HeaderMenu from "@/components/HeaderMenu.vue";
import { useDownload } from "@/composables/useDownload";
import { useApplicationStore } from "@/stores/application-module";
import * as downloadApi from "@/api/download-api";
import { copyToClipboard } from "@/utils/clipboard";
import truncate from "@/utils/truncate";

export default {
  name: "TasksTable",
  components: {
    DateTimeDisplay,
    TagViewer,
    TooltipButton,
    HeaderMenu,
  },
  inject: ["snack", "confirm"],
  props: {
    entity: {
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
    selectedEntities: {
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
    config: {
      type: Object,
      required: true,
    },
    adapter: {
      type: Object,
      required: true,
    },
  },
  emits: ["refresh-tags"],
  setup() {
    const instance = getCurrentInstance();
    const { start, stop } = useAutoRefresh(
      () => instance.proxy.debouncedGetTasks(),
      8000,
    );
    const { downloadStager, downloadText } = useDownload();
    return { start, stop, downloadStager, downloadText };
  },
  data() {
    return {
      tasks: [],
      currentPage: 1,
      totalItems: 0,
      itemsPerPage: 10,
      loading: false,
      sortBy: [{ key: "updated_at", order: "desc" }],
      expandedTasks: {},
      debouncedGetTasks: debounce(this.getTasks, 500),
      selectedHeadersTemp: [],
    };
  },
  computed: {
    applicationStore() {
      return useApplicationStore();
    },
    headersFull() {
      return this.config.columns;
    },
    headersForMenu() {
      return this.headersFull.filter((h) => !this.hideColumns.includes(h.key));
    },
    headers() {
      return this.headersFull
        .filter(
          (h) =>
            // hideColumns is a per-instance prop (e.g. Dashboard's mini
            // table hiding id/task_name), so it's applied on top of and
            // independent from the persisted header-store selection below —
            // a hidden column can't be brought back by picking it in the
            // HeaderMenu, since that only affects the store, not this prop.
            !this.hideColumns.includes(h.key) &&
            // alwaysShow columns bypass the persisted header selection —
            // they render regardless of the stored choices (they are
            // never HeaderMenu options and are never persisted; only the
            // hideColumns prop above can suppress them).
            (h.alwaysShow ||
              this.applicationStore[this.config.headerStoreKey].findIndex(
                (h2) => h2.key === h.key,
              ) > -1),
        )
        .sort((a, b) => a.order - b.order);
    },
  },
  watch: {
    refreshTasks: {
      handler(newVal) {
        if (newVal) {
          this.start();
        } else {
          this.stop();
        }
      },
      immediate: true,
    },
    currentPage() {
      this.debouncedGetTasks();
    },
    entity() {
      this.debouncedGetTasks();
    },
    selectedEntities() {
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
  mounted() {
    this.debouncedGetTasks();
    // The store holds only the user's selectable picks — alwaysShow
    // columns are never persisted (they render regardless of the stored
    // selection via the `headers` short-circuit). Strip alwaysShow
    // entries persisted by older builds BEFORE judging the store: a
    // pre-fix deselect-all left exactly [expand, Actions], whose truthy
    // "Actions" title would otherwise defeat the reseed guard and leave
    // an already-affected install stuck with no data columns. After
    // cleaning, reseed when nothing titled remains — an empty store
    // (deselect-all save) or a legacy {text, value} shape with no titled
    // entries; [].some() is false, so one check covers both.
    const storedHeaders = this.applicationStore[this.config.headerStoreKey];
    const cleanedHeaders = storedHeaders.filter((h) => !h.alwaysShow);
    if (!cleanedHeaders.some((h) => h.title)) {
      this.applicationStore[this.config.headerStoreKey] =
        this.headersFull.filter(
          (h) => h.defaultHeader === true && !h.alwaysShow,
        );
    } else if (cleanedHeaders.length !== storedHeaders.length) {
      // Write back only when the cleanup actually removed something —
      // every store write re-serializes the whole persisted state.
      this.applicationStore[this.config.headerStoreKey] = cleanedHeaders;
    }
    this.selectedHeadersTemp = this.headersFull.filter((h) =>
      this.applicationStore[this.config.headerStoreKey].some(
        (h2) => h2.key === h.key,
      ),
    );
  },
  methods: {
    submitHeaderForm(val) {
      this.selectedHeadersTemp = val;
      this.applicationStore[this.config.headerStoreKey] = [
        ...this.selectedHeadersTemp,
      ];
    },
    isAnsi,
    ansiToHtml,
    deleteTag(task, tag) {
      this.adapter
        .deleteTag(task[this.config.idField], task.id, tag.id)
        .then(() => {
          task.tags = task.tags.filter((t) => t.id !== tag.id);
          this.$emit("refresh-tags");
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    addBlankLines(text) {
      return `\n${text}\n`;
    },
    addTag(task, payload) {
      this.adapter
        .addTag(task[this.config.idField], task.id, payload)
        .then((t) => {
          if (!task.tags.some((x) => x.id === t.id)) task.tags.push(t);
          this.$emit("refresh-tags");
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    truncateMessage(task) {
      return truncate(task, 30);
    },
    truncateOption(value) {
      return truncate(value, 20);
    },
    updateTaskBackgroundColor(task) {
      if (task.backgroundColor === "black") {
        task.backgroundColor = "white";
      } else {
        task.backgroundColor = "black";
      }
      this.expandedTasks[task.uniqueId].backgroundColor = task.backgroundColor;

      // Trigger reactivity on the table
      this.tasks.splice(this.tasks.indexOf(task), 1, task);
    },
    downloadFile(download) {
      downloadApi.getDownload(download.id);
    },
    hasOutput(task) {
      return !!task.output;
    },
    async downloadInput(task) {
      if (task.input) {
        try {
          if (!this.expandedTasks[task.uniqueId]?.full_input) {
            const data = await this.adapter.getTask(
              task[this.config.idField],
              task.id,
            );
            this.expandedTasks[task.uniqueId] = {
              ...this.expandedTasks[task.uniqueId],
              ...data,
            };
          }

          this.downloadText(
            this.expandedTasks[task.uniqueId].full_input,
            `${task.uniqueId}-input.txt`,
          );
        } catch (err) {
          this.snack.error(
            `Error loading task ${task.id} for download: ${err}`,
          );
        }
      }
    },
    downloadOutput(task) {
      if (task.output) {
        this.downloadText(task.output, `${task.uniqueId}-output.txt`);
      }
    },
    async copyInput(task) {
      if (task.input) {
        try {
          if (!this.expandedTasks[task.uniqueId]?.full_input) {
            const data = await this.adapter.getTask(
              task[this.config.idField],
              task.id,
            );
            this.expandedTasks[task.uniqueId] = {
              ...this.expandedTasks[task.uniqueId],
              ...data,
            };
          }

          await copyToClipboard(
            this.expandedTasks[task.uniqueId].full_input,
            this.snack,
          );
        } catch (err) {
          this.snack.error(`Error loading task ${task.id} for copy: ${err}`);
        }
      }
    },
    async copyOutput(task) {
      if (task.output) {
        await copyToClipboard(task.output, this.snack);
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
      try {
        if (!this.expandedTasks[task.uniqueId].imagesRetrieved) {
          const data = await this.adapter.getTask(
            task[this.config.idField],
            task.id,
          );
          this.expandedTasks[task.uniqueId] = {
            ...this.expandedTasks[task.uniqueId],
            ...data,
            imagesRetrieved: true,
          };
        }

        const expandedDownloads = this.expandedTasks[task.uniqueId].downloads;
        for (const download of expandedDownloads) {
          if (
            !download.image &&
            download.filename.match(/[^/]+(jpg|jpeg|png|gif)$/)
          ) {
            // eslint-disable-next-line
            const url = await downloadApi.getDownloadAsUrl(download.id);
            download.image = url;
          }
        }
        this.tasks.splice(this.tasks.indexOf(task), 1, task);
      } catch (err) {
        this.snack.error(`Error loading images for task ${task.id}: ${err}`);
      }
    },
    async toggleSeeFullInput(task) {
      if (!task.expandedInput) {
        try {
          const data = await this.adapter.getTask(
            task[this.config.idField],
            task.id,
          );
          this.expandedTasks[task.uniqueId] = {
            ...this.expandedTasks[task.uniqueId],
            ...data,
            expandedInput: true,
          };
          task.expandedInput = true;
        } catch (err) {
          this.snack.error(`Error loading task ${task.id}: ${err}`);
          return;
        }
      } else {
        this.expandedTasks[task.uniqueId].expandedInput = false;
        task.expandedInput = false;
      }

      // Trigger reactivity on the table
      this.tasks.splice(this.tasks.indexOf(task), 1, task);
    },
    async handleItemExpanded(expandedIds) {
      const toLoad = expandedIds.filter(
        (uniqueId) =>
          this.expandedTasks[uniqueId] &&
          !this.expandedTasks[uniqueId].fullTaskLoaded,
      );

      await Promise.all(
        toLoad.map(async (uniqueId) => {
          const item = this.tasks.find((t) => t.uniqueId === uniqueId);
          if (!item) return;
          try {
            const data = await this.adapter.getTask(
              item[this.config.idField],
              item.id,
            );
            this.expandedTasks[item.uniqueId] = {
              ...this.expandedTasks[item.uniqueId],
              ...data,
              fullTaskLoaded: true,
            };
            this.tasks.splice(this.tasks.indexOf(item), 1, item);
          } catch (err) {
            this.snack.error(`Error loading task ${item.id}: ${err}`);
          }
        }),
      );
    },
    supportsRerun(item) {
      return this.adapter.supportsRerun(item);
    },
    rerunTask(item) {
      return this.adapter.rerunTask(item, { snack: this.snack });
    },
    async stopTask(item) {
      if (!this.adapter.stopTask) {
        this.snack.error("Stopping this task type is not supported.");
        return;
      }
      if (
        !(await this.confirm("Stop Task", "Do you want to stop this task?"))
      ) {
        return;
      }
      return this.adapter.stopTask(item, { snack: this.snack });
    },
    handleOptionsChange(value) {
      this.currentPage = value.page;
      this.itemsPerPage = value.itemsPerPage;
      this.sortBy = Array.isArray(value.sortBy) ? value.sortBy : [];
      this.debouncedGetTasks();
    },
    async getTasks() {
      if (
        !this.noFilters &&
        (this.selectedEntities.length === 0 || this.selectedUsers.length === 0)
      ) {
        // seems weird to do this but it would be weirder to select all entities
        // when no entities are selected. Even though the api sees no entities as all entities.
        this.tasks = [];
        this.currentPage = 1;
        this.totalItems = 0;
        return;
      }
      this.loading = true;
      let selected = null;
      if (this.selectedEntities.length > 0) {
        selected = this.selectedEntities;
      }
      const sortEntry =
        this.sortBy.length > 0 ? this.sortBy[0] : { key: "id", order: "desc" };
      try {
        const response = await this.adapter.getTasks(selected, {
          page: this.currentPage,
          limit: this.itemsPerPage,
          sortBy: sortEntry.key,
          sortOrder: sortEntry.order,
          users: this.selectedUsers,
          tags: this.selectedTags,
          search: this.search,
        });
        this.currentPage = response.page;
        this.totalItems = response.total;

        // iterate response.records and add expandedInput if it exists in expandedTasks
        // this ensures that the expandedInput doesn't get wiped away after a refresh
        this.tasks = response.records.map((task) => {
          task.uniqueId = `${task[this.config.idField]}-${task.id}`;

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
      } catch (err) {
        this.snack.error(`Failed to load tasks: ${err}`);
      } finally {
        this.loading = false;
      }
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
