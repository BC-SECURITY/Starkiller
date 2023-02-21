<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="true"
      :show-refresh="false"
      :show-delete="showDelete"
      @create="create"
      @delete="deleteStagers"
    />
    <div
      class="ml-3 mr-3 align-center"
      style="display: flex; "
    >
      <v-switch
        v-model="filterOnlyMyStagersCheckbox"
        label="Only My Stagers"
      />
    </div>
    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="filteredStagers"
      :footer-props="{
        itemsPerPageOptions: [5, 10, 15, 20, 50, 100],
      }"
      :items-per-page="15"
      item-key="id"
      dense
      show-select
    >
      <template #item.name="{ item }">
        <router-link
          style="color: inherit;"
          :to="{ name: 'stagerEdit', params: { id: item.id } }"
        >
          {{ item.name }}
        </router-link>
      </template>
      <template #item.options.Listener="{ item }">
        <router-link
          style="color: inherit;"
          :to="{ name: 'listenerEdit', params: { id: item.id } }"
        >
          {{ item.options.Listener }}
        </router-link>
      </template>
      <template #item.created_at="{ item }">
        <v-tooltip top>
          <template #activator="{ on }">
            <span v-on="on">{{ moment(item.created_at).fromNow() }}</span>
          </template>
          <span>{{ moment(item.created_at).format('MMM D YYYY, h:mm:ss a') }}</span>
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
              v-if="isDownload(item)"
              key="download"
              link
              @click="download(item)"
            >
              <v-list-item-title>
                <v-icon>fa-download</v-icon>
                Download
              </v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="isOneLiner(item)"
              key="clipboard"
              link
              @click="copy(item)"
            >
              <v-list-item-title>
                <v-icon>fa-paperclip</v-icon>
                Copy to Clipboard
              </v-list-item-title>
            </v-list-item>
            <v-list-item
              key="copy"
              :to="{ name: 'stagerNew', params: { copy: true, id: item.id } }"
              link
            >
              <v-list-item-title>
                <v-icon>fa-clone</v-icon>
                Copy
              </v-list-item-title>
            </v-list-item>
            <v-divider class="pb-4" />
            <v-list-item
              key="delete"
              link
              @click="deleteStager(item)"
            >
              <v-list-item-title>
                <v-icon>fa-trash-alt</v-icon>
                Delete
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import DownloadMixin from '@/mixins/download-stager';
import CopyMixin from '@/mixins/copy-stager';
import moment from 'moment';
import ListPageTop from '@/components/ListPageTop.vue';
import * as downloadApi from '@/api/download-api';

export default {
  name: 'Stagers',
  components: {
    ListPageTop,
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
        { text: 'Listener', value: 'options.Listener' },
        { text: 'Type', value: 'template' },
        { text: 'Language', value: 'options.Language' },
        { text: 'Created At', value: 'created_at' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      selected: [],
    };
  },
  computed: {
    ...mapState({
      stagers: (state) => state.stager.stagers,
      filterOnlyMyStagersCheckbox: (state) => state.application.filterOnlyMyStagers,
    }),
    filteredStagers() {
      return this.stagers.filter((stager) => {
        if (this.filterOnlyMyStagers) {
          return stager.user_id === this.user.id;
        }
        return true;
      });
    },
    showDelete() {
      return this.selected.length > 0;
    },
    filterOnlyMyStagersCheckbox: {
      set(val) {
        this.$store.dispatch('application/filterOnlyMyStagers', val);
      },
      get() {
        return this.filterOnlyMyStagers;
      },
    },
  },
  mounted() {
    this.$store.dispatch('stager/getStagers');
  },
  methods: {
    create() {
      this.$router.push({ name: 'stagerNew' });
    },
    isDownload(stager) {
      return stager.downloads && stager.downloads.length > 0;
    },
    isOneLiner(stager) {
      return stager.one_liner;
    },
    async copy(stager) {
      // later on we could display multiple files, but at the moment,
      // i think it makes sense to just get the last one.
      const lastIndex = stager.downloads.length - 1;
      return this.copyStager(await downloadApi.getDownloadAsText(stager.downloads[lastIndex].id));
    },
    async download(stager) {
      // later on we could display multiple files, but at the moment,
      // i think it makes sense to just get the last one.
      const lastIndex = stager.downloads.length - 1;
      return downloadApi.getDownload(stager.downloads[lastIndex].id);
    },
    async deleteStager(item) {
      if (await this.$root.$confirm('Delete', 'Are you sure you want to delete this stager?', { color: 'red' })) {
        this.$store.dispatch('stager/deleteStager', item.id);
      }
    },
    async deleteStagers() {
      if (await this.$root.$confirm('Delete', `Are you sure you want to delete ${this.selected.length} stagers?`, { color: 'red' })) {
        this.selected.forEach((stager) => {
          this.$store.dispatch('stager/deleteStager', stager.id);
        });
        this.selected = [];
      }
    },
  },
};
</script>

<style>

</style>
