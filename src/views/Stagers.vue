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
    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="stagers"
      :footer-props="{
        itemsPerPageOptions: [5, 10, 15, 20, 50, 100],
      }"
      :items-per-page="15"
      item-key="id"
      dense
      show-select
    >
      <template #item.StarkillerName.Value="{ item }">
        <router-link
          style="color: inherit;"
          :to="{ name: 'stagerEdit', params: { id: item.id }}"
        >
          {{ item.StarkillerName.Value }}
        </router-link>
      </template>
      <template #item.Listener.Value="{ item }">
        <router-link
          style="color: inherit;"
          :to="{ name: 'listenerEdit', params: { id: item.Listener.Value }}"
        >
          {{ item.Listener.Value }}
        </router-link>
      </template>
      <template #item.createdAt="{ item }">
        <v-tooltip top>
          <template #activator="{ on }">
            <span v-on="on">{{ moment(item.createdAt).fromNow() }}</span>
          </template>
          <span>{{ moment(item.createdAt).format('lll') }}</span>
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
              v-else
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
        { text: 'Name', value: 'StarkillerName.Value' },
        { text: 'Listener', value: 'Listener.Value' },
        { text: 'Type', value: 'name' },
        { text: 'Language', value: 'Language.Value' },
        { text: 'Created At', value: 'createdAt' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      selected: [],
    };
  },
  computed: {
    ...mapState({
      stagers: (state) => state.stager.stagers,
    }),
    showDelete() {
      return this.selected.length > 0;
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
      return stager.OutFile && stager.OutFile.Value.length > 0;
    },
    async copy(stager) {
      return this.copyStager(stager.Output);
    },
    async download(stager) {
      return this.downloadStager(stager.Output, stager.OutFile.Value);
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
      }
    },
  },
};
</script>

<style>

</style>
