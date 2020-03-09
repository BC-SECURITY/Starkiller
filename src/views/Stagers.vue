<template>
  <div class="route-container">
    <div class="headers">
      <div style="display: flex; flex-direction: row;">
        <h3>Stagers</h3>
        <el-tooltip :content="tooltipText">
          <i
            style="align-self: center;"
            class="el-icon-question"
          />
        </el-tooltip>
      </div>
      <el-button
        type="primary"
        round
        @click="create"
      >
        Generate Stager
      </el-button>
    </div>
    <stager-viewer
      :visible="visible"
      :view="view"
      :view-object="viewObject"
      @close="close"
    />
    <el-table
      :data="stagers"
      class="main-table"
      @row-click="viewStager"
    >
      <el-table-column
        prop="name"
        label="Name"
        sortable
      />
      <el-table-column
        prop="Listener.Value"
        label="Listener"
        width="180"
        sortable
      />
      <el-table-column
        prop="Language.Value"
        label="Language"
        width="180"
        sortable
      />
      <el-table-column
        prop="SafeChecks.Value"
        label="SafeChecks"
        width="180"
        sortable
      />
      <el-table-column
        prop="createdAt"
        label="Created At"
        width="180"
        sortable
      >
        <template slot-scope="scope">
          <el-tooltip :content="moment(scope.row.createdAt).format('lll')">
            <div>{{ moment(scope.row.createdAt).fromNow() }}</div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        fixed="right"
        label="Operations"
        width="150"
      >
        <template slot-scope="scope">
          <el-button
            v-if="isDownload(scope.$index, stagers)"
            type="success"
            icon="el-icon-download"
            label="Download"
            circle
            size="small"
            @click="download(scope.$index, stagers)"
          />
          <el-button
            v-else
            type="success"
            icon="el-icon-paperclip"
            label="Copy"
            circle
            size="small"
            @click="copy(scope.$index, stagers)"
          />
          <el-button
            type="danger"
            icon="el-icon-delete"
            label="Delete"
            circle
            size="small"
            @click="deleteStager(scope.$index)"
          />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { namespacedElectronStore as electronStore } from '@/store/electron-store';
import StagerViewer from '@/components/stagers/StagerViewer.vue';
import DownloadMixin from '@/mixins/download-stager';
import CopyMixin from '@/mixins/copy-stager';
import moment from 'moment';

export default {
  name: 'Stagers',
  components: {
    StagerViewer,
  },
  mixins: [DownloadMixin, CopyMixin],
  data() {
    return {
      visible: false,
      view: false,
      viewObject: {},
      stagers: [],
      tooltipText: 'These are stagers you have generated in the past.',
    };
  },
  computed: {
  },
  mounted() {
    this.moment = moment;
    this.getStagers();
  },
  methods: {
    create() {
      this.visible = true;
    },
    close() {
      this.visible = false;
      this.view = false;
      this.viewObject = {};
      // electronStore is a bit slower. We could wrap this stuff
      // into the vuex store for reactivity.
      setTimeout(() => this.getStagers(), 1000);
    },
    viewStager(row, column) {
      if (column.label === 'Operations') {
        return;
      }

      this.visible = true;
      this.view = true;
      this.viewObject = row;
    },
    async deleteStager(index) {
      try {
        await this.$confirm('Are you sure you want to delete this stager?');
      } catch (err) {
        return;
      }

      this.stagers.splice(index, 1);
      electronStore.set('generatedStagers', this.stagers);
    },
    isDownload(index, rows) {
      const stager = rows[index];
      return stager.OutFile.Value.length > 0;
    },
    async copy(index, rows) {
      const stager = rows[index];
      return this.copyStager(stager.Output);
    },
    async download(index, rows) {
      const stager = rows[index];
      return this.downloadStager(stager.Output, stager.OutFile.Value);
    },
    getStagers() {
      this.stagers = electronStore.get('generatedStagers');
    },
  },
};
</script>

<style>

</style>
