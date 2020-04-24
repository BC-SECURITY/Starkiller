<template>
  <div class="route-container">
    <v-breadcrumbs :items="breads" />

    <div class="headers">
      <h3>Stagers</h3>
      <v-btn
        color="primary"
        rounded
        @click="create"
      >
        Generate Stager
      </v-btn>
    </div>
    <v-data-table
      :headers="headers"
      :items="stagers"
    >
      <template v-slot:item.createdAt="{ item }">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <span v-on="on">{{ moment(item.createdAt).fromNow() }}</span>
          </template>
          <span>{{ moment(item.createdAt).format('lll') }}</span>
        </v-tooltip>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-icon
          v-if="isDownload(item)"
          style="padding-right: 5px"
          small
          @click="download(item)"
        >
          fa-download
        </v-icon>
        <v-icon
          v-else
          style="padding-right: 5px"
          small
          @click="copy(item)"
        >
          fa-paperclip
        </v-icon>
        <v-icon
          small
          @click="deleteStager(item)"
        >
          fa-trash-alt
        </v-icon>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { namespacedElectronStore as electronStore } from '@/store/electron-store';
import DownloadMixin from '@/mixins/download-stager';
import CopyMixin from '@/mixins/copy-stager';
import moment from 'moment';

export default {
  name: 'Stagers',
  components: {
  },
  mixins: [DownloadMixin, CopyMixin],
  data() {
    return {
      moment,
      breads: [
        {
          text: 'Stagers',
          disabled: true,
          href: '/stagers',
        },
      ],
      headers: [
        { text: 'Name', value: 'name' },
        { text: 'Listener', value: 'Listener.Value' },
        { text: 'Language', value: 'Language.Value' },
        { text: 'SafeChecks', value: 'SafeChecks.Value' },
        { text: 'Created At', value: 'createdAt' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
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
    this.getStagers();
  },
  methods: {
    create() {
      this.$router.push({ name: 'stagerNew' });
    },
    close() {
      this.visible = false;
      this.view = false;
      this.viewObject = {};
      // electronStore is a bit slower. So give it time to save.
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
    isDownload(stager) {
      return stager.OutFile.Value.length > 0;
    },
    async copy(stager) {
      return this.copyStager(stager.Output);
    },
    async download(stager) {
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
