<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="false"
      :show-refresh="true"
      :show-delete="false"
      @refresh="refreshDownloads"
    >
      <template slot="extra-stuff">
        <v-text-field
          v-model="filter"
          append-icon="mdi-magnify"
          outlined
          dense
          label="Search"
          style="max-width: 500px; padding-top: 25px; padding-right: 20px;"
        />
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
        >
      </template>
    </list-page-top>
    <div style="display: flex; flix-direction: row;">
      <v-card
        class="mr-2 pa-2"
        style="width:300px;"
      >
        <v-expansion-panels
          class="mb-6"
          multiple
        >
          <v-expansion-panel>
            <v-expansion-panel-header expand-icon="mdi-menu-down">
              Source
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-checkbox
                v-model="selectedAllSources"
                x-small
                dense
                label="Select All"
              />
              <v-divider class="pb-4" />
              <v-checkbox
                v-for="source in sources"
                :key="source.value"
                v-model="selectedSources"
                :value="source.value"
                x-small
                dense
                :label="source.label"
                @change="handleFilterChange"
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
      <v-card style="flex-grow: 1;">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="10"
          @input="handlePageChange"
        />
        <v-data-table
          :headers="headers"
          :items="items"
          item-key="id"
          :sort-by="sortBy"
          :sort-desc="sortDesc"
          :server-items-length="totalItems"
          :footer-props="{ 'items-per-page-options': [10, 25, 50, 100] }"
          :items-per-page.sync="itemsPerPage"
          :loading="loading"
          :page="currentPage"
          @update:options="handleOptionsChange"
        >
          <template #item.updated_at="{ item }">
            <v-tooltip top>
              <template #activator="{ on }">
                <span v-on="on">{{ moment(item.updated_at).fromNow() }}</span>
              </template>
              <span>{{ moment(item.updated_at).format('MMM D YYYY, h:mm:ss a') }}</span>
            </v-tooltip>
          </template>
          <template #item.created_at="{ item }">
            <v-tooltip top>
              <template #activator="{ on }">
                <span v-on="on">{{ moment(item.created_at).fromNow() }}</span>
              </template>
              <span>{{ moment(item.created_at).format('MMM D YYYY, h:mm:ss a') }}</span>
            </v-tooltip>
          </template>
          <template #item.size="{ item }">
            <span>{{ formatBytes(item.size) }}</span>
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
                <v-spacer />
                <v-list-item
                  link
                  @click="downloadFile(item)"
                >
                  <v-list-item-title>
                    <v-icon>fa-download</v-icon>
                    Download
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
import * as downloadApi from '@/api/download-api';
import debounce from 'lodash.debounce';
import ListPageTop from '@/components/ListPageTop.vue';
import moment from 'moment';
import TooltipButton from '@/components/TooltipButton.vue';

export default {
  name: 'Downloads',
  components: {
    ListPageTop,
    TooltipButton,
  },
  data() {
    return {
      moment,
      items: [],
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10,
      sortBy: 'updated_at',
      sortDesc: true,
      loading: false,
      filter: '',
      breads: [
        {
          text: 'Downloads',
          disabled: true,
          href: '/downloads',
        },
      ],
      headers: [
        { text: 'Id', value: 'id', sortable: false },
        { text: 'Filename', value: 'filename', sortable: true },
        { text: 'Location', value: 'location', sortable: true },
        { text: 'Size', value: 'size', sortable: true },
        { text: 'Created At', value: 'created_at', sortable: true },
        { text: 'Updated At', value: 'updated_at', sortable: true },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      isSelecting: false,
      selectedFile: null,
      selectedSources: [],
      sources: [
        {
          label: 'Upload',
          value: 'upload',
        },
        {
          label: 'Agent Task',
          value: 'agent_task',
        },
        {
          label: 'Agent File',
          value: 'agent_file',
        },
        {
          label: 'Stager',
          value: 'stager',
        },
      ],
      debouncedSearch: debounce(this.search, 500),
    };
  },
  computed: {
    selectedAllSources: {
      set(val) {
        if (val) {
          this.selectedSources = this.sources.map((s) => s.value);
        } else {
          this.selectedSources = [];
        }
        this.search();
      },
      get() {
        return this.selectedSources.length === this.sources.length;
      },
    },
  },
  watch: {
    filter() {
      this.debouncedSearch();
    },
  },
  async mounted() {
    this.selectedSources = this.sources.map((s) => s.value);
    this.search();
  },
  methods: {
    async search() {
      this.loading = true;
      const response = await downloadApi.getDownloads({
        page: this.currentPage,
        limit: this.itemsPerPage,
        query: this.filter,
        sources: this.selectedSources,
        sortBy: this.sortBy,
        sortOrder: this.sortDesc ? 'desc' : 'asc',
      });
      this.items = response.records;
      this.currentPage = response.page;
      this.totalPages = response.total_pages;
      this.totalItems = response.total;
      this.loading = false;
    },
    downloadFile(download) {
      downloadApi.getDownload(download.id);
    },
    async refreshDownloads() {
      this.search();
    },
    handleFileImport() {
      this.isSelecting = true;

      // After obtaining the focus when closing the FilePicker, return the button state to normal
      window.addEventListener('focus', () => {
        this.isSelecting = false;
      }, { once: true });

      // Trigger click on the FileInput
      this.$refs.uploader.click();
    },
    async onFileChanged(e) {
      // eslint-disable-next-line prefer-destructuring
      this.selectedFile = e.target.files[0];

      const data = new FormData();
      data.append('file', this.selectedFile);

      await downloadApi.createDownload(data);
      this.$snack.success('Upload complete');
      this.debouncedSearch();
    },
    handleFilterChange() {
      this.debouncedSearch();
    },
    handlePageChange(page) {
      this.currentPage = page;
      this.debouncedSearch();
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
        this.sortBy = 'updated_at';
        this.sortDesc = true;
      }
      this.debouncedSearch();
    },
    // https://gist.github.com/zentala/1e6f72438796d74531803cc3833c039c
    formatBytes(bytes, decimals) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals || 2;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / (k ** i)).toFixed(dm))} ${sizes[i]}`;
    },
  },
};
</script>

<style>

</style>
