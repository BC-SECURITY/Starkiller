<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="false"
      :show-refresh="true"
      :show-delete="false"
      @refresh="refreshDownloads"
    >
      <template #extra-stuff>
        <tooltip-button
          icon="fa-upload"
          text="Upload"
          @click="handleFileImport"
        />
        <input
          ref="uploader"
          class="d-none"
          type="file"
          aria-label="uploader"
          @change="onFileChanged"
        />
      </template>
    </list-page-top>
    <div style="display: flex; flex-direction: row; flex-wrap: wrap">
      <v-card class="mr-2 pa-2" elevation="2" border style="flex-basis: 250px">
        <v-expansion-panels class="mb-6" multiple>
          <expansion-panel-search
            v-model="search"
            title="Search"
            label="Search"
          />
          <expansion-panel-filter
            v-model="selectedSources"
            title="Source"
            label="label"
            item-key="value"
            item-value="value"
            :items="sources"
          />
          <expansion-panel-filter
            v-model="selectedTags"
            title="Tags"
            label="label"
            item-key="id"
            item-value="label"
            :items="tags"
            :empty-default="true"
          />
        </v-expansion-panels>
      </v-card>
      <v-card style="flex: 1; min-width: 0" elevation="2" border>
        <v-data-table-server
          v-model:sort-by="sortBy"
          v-model:items-per-page="itemsPerPage"
          v-model:page="currentPage"
          :headers="headers"
          :items="items"
          item-value="id"
          :items-length="totalItems"
          :items-per-page-options="[10, 25, 50, 100]"
          :loading="loading"
          @update:options="handleOptionsChange"
        >
          <template #item.updated_at="{ item }">
            <date-time-display :timestamp="item.updated_at" />
          </template>
          <template #item.created_at="{ item }">
            <date-time-display :timestamp="item.created_at" />
          </template>
          <template #item.size="{ item }">
            <span>{{ formatBytes(item.size) }}</span>
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
            <v-menu>
              <template #activator="{ props: activatorProps }">
                <v-btn
                  variant="text"
                  icon
                  size="x-small"
                  v-bind="activatorProps"
                >
                  <v-icon>fa-ellipsis-v</v-icon>
                </v-btn>
              </template>
              <v-list class="ml-2 mr-2">
                <v-spacer />
                <v-list-item link @click="downloadFile(item)">
                  <v-list-item-title>
                    <v-icon>fa-download</v-icon>
                    Download
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-data-table-server>
      </v-card>
    </div>
  </div>
</template>

<script>
import * as downloadApi from "@/api/download-api";
import debounce from "lodash.debounce";
import ListPageTop from "@/components/ListPageTop.vue";
import TooltipButton from "@/components/TooltipButton.vue";
import TagViewer from "@/components/TagViewer.vue";
import ExpansionPanelFilter from "@/components/tables/ExpansionPanelFilter.vue";
import ExpansionPanelSearch from "@/components/tables/ExpansionPanelSearch.vue";
import DateTimeDisplay from "@/components/DateTimeDisplay.vue";
import { fetchDedupedTags } from "@/utils/tags";

export default {
  name: "Downloads",
  components: {
    DateTimeDisplay,
    ExpansionPanelSearch,
    ExpansionPanelFilter,
    TagViewer,
    ListPageTop,
    TooltipButton,
  },
  inject: ["snack"],
  data() {
    return {
      items: [],
      currentPage: 1,
      totalItems: 0,
      itemsPerPage: 10,
      sortBy: [{ key: "updated_at", order: "desc" }],
      loading: false,
      search: "",
      breads: [
        {
          title: "Downloads",
          disabled: true,
          href: "/downloads",
        },
      ],
      headers: [
        { title: "Id", key: "id", sortable: false },
        { title: "Filename", key: "filename", sortable: true },
        { title: "Size", key: "size", sortable: true },
        { title: "Created At", key: "created_at", sortable: true },
        { title: "Updated At", key: "updated_at", sortable: true },
        { title: "Tags", key: "tags", sortable: false },
        { title: "Actions", key: "actions", sortable: false },
      ],
      isSelecting: false,
      selectedFile: null,
      selectedSources: [],
      sources: [
        {
          label: "Upload",
          value: "upload",
        },
        {
          label: "Agent Task",
          value: "agent_task",
        },
        {
          label: "Agent File",
          value: "agent_file",
        },
        {
          label: "Stager",
          value: "stager",
        },
      ],
      selectedTags: [],
      tags: [],
      debouncedGetDownloads: debounce(this.getDownloads, 500),
    };
  },
  watch: {
    search() {
      this.debouncedGetDownloads();
    },
    selectedSources() {
      this.debouncedGetDownloads();
    },
    selectedTags() {
      this.debouncedGetDownloads();
    },
  },
  async mounted() {
    this.selectedSources = this.sources.map((s) => s.value);
    this.getTags();
    this.getDownloads();
  },
  methods: {
    async getTags() {
      this.tags = await fetchDedupedTags("download");
    },
    deleteTag(download, tag) {
      downloadApi
        .deleteTag(download.id, tag.id)
        .then(() => {
          download.tags = download.tags.filter((t) => t.id !== tag.id);
          this.getTags();
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    updateTag(download, tag) {
      downloadApi
        .updateTag(download.id, tag)
        .then((t) => {
          const index = download.tags.findIndex((x) => x.id === t.id);
          download.tags.splice(index, 1, t);
          this.getTags();
          this.snack.success("Tag updated");
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    addTag(download, tag) {
      downloadApi
        .addTag(download.id, tag)
        .then((t) => {
          download.tags.push(t);
          this.getTags();
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    async getDownloads() {
      this.loading = true;
      const sortEntry =
        this.sortBy.length > 0
          ? this.sortBy[0]
          : { key: "updated_at", order: "desc" };
      const response = await downloadApi.getDownloads({
        page: this.currentPage,
        limit: this.itemsPerPage,
        query: this.search,
        sources: this.selectedSources,
        sortBy: sortEntry.key,
        sortOrder: sortEntry.order,
        tags: this.selectedTags,
      });
      this.items = response.records;
      this.currentPage = response.page;
      this.totalItems = response.total;
      this.loading = false;
    },
    downloadFile(download) {
      downloadApi.getDownload(download.id);
    },
    async refreshDownloads() {
      this.debouncedGetDownloads();
    },
    handleFileImport() {
      this.isSelecting = true;

      // After obtaining the focus when closing the FilePicker, return the button state to normal
      window.addEventListener(
        "focus",
        () => {
          this.isSelecting = false;
        },
        { once: true },
      );

      // Trigger click on the FileInput
      this.$refs.uploader.click();
    },
    async onFileChanged(e) {
      this.selectedFile = e.target.files[0];

      const data = new FormData();
      data.append("file", this.selectedFile);

      try {
        await downloadApi.createDownload(data);
        this.snack.success("Upload complete");
        this.debouncedGetDownloads();
      } catch (err) {
        this.snack.error(`Upload failed: ${err}`);
      }
    },
    handleOptionsChange(value) {
      this.currentPage = value.page;
      this.itemsPerPage = value.itemsPerPage;
      this.sortBy = value.sortBy;
      this.debouncedGetDownloads();
    },
    // https://gist.github.com/zentala/1e6f72438796d74531803cc3833c039c
    formatBytes(bytes, decimals) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const dm = decimals || 2;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
    },
  },
};
</script>

<style></style>
