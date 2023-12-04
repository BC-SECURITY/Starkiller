<template>
  <div>
    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="filteredStagers"
      :footer-props="{
        itemsPerPageOptions: [5, 10, 15, 20, 50, 100],
      }"
      :items-per-page="15"
      :loading="stagersStatus === 'loading'"
      item-key="id"
      dense
      show-select
    >
      <template #item.name="{ item }">
        <router-link
          style="color: inherit"
          :to="{ name: 'stagerEdit', params: { id: item.id } }"
        >
          {{ item.name }}
        </router-link>
      </template>
      <template #item.options.Listener="{ item }">
        <router-link
          style="color: inherit"
          :to="{ name: 'listenerEdit', params: { id: item.id } }"
        >
          {{ item.options.Listener }}
        </router-link>
      </template>
      <template #item.created_at="{ item }">
        <date-time-display :timestamp="item.created_at" />
      </template>
      <template #item.actions="{ item }">
        <v-menu offset-y>
          <template #activator="{ on, attrs }">
            <v-btn text icon x-small v-bind="attrs" v-on="on">
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
            <v-list-item key="delete" link @click="deleteStager(item)">
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
import moment from "moment";
import DownloadMixin from "@/mixins/download-stager";
import CopyMixin from "@/mixins/copy-stager";
import DateTimeDisplay from "@/components/DateTimeDisplay.vue";
import * as downloadApi from "@/api/download-api";
import { useStagerStore } from "@/stores/stager-module";
import { useApplicationStore } from "@/stores/application-module";

export default {
  name: "StagersTable",
  components: {
    DateTimeDisplay,
  },
  mixins: [DownloadMixin, CopyMixin],
  props: {
    onlyMyStagers: {
      type: Boolean,
      default: false,
    },
    input: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      moment,
      headers: [
        { text: "Name", value: "name" },
        { text: "Listener", value: "options.Listener" },
        { text: "Type", value: "template" },
        { text: "Language", value: "options.Language" },
        { text: "Created At", value: "created_at" },
        { text: "Actions", value: "actions", sortable: false },
      ],
      selected: [],
    };
  },
  computed: {
    stagerStore() {
      return useStagerStore();
    },
    applicationStore() {
      return useApplicationStore();
    },
    stagers() {
      return this.stagerStore.stagers;
    },
    stagersStatus() {
      return this.stagerStore.status;
    },
    userId() {
      return this.applicationStore.user.id;
    },
    filteredStagers() {
      if (this.onlyMyStagers) {
        return this.stagers.filter((stager) => stager.user_id === this.userId);
      }

      return this.stagers;
    },
  },
  watch: {
    selected(val) {
      this.$emit("input", val);
    },
  },
  mounted() {
    this.getStagers();
  },
  methods: {
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
      return this.copyStager(
        await downloadApi.getDownloadAsText(stager.downloads[lastIndex].id),
      );
    },
    async download(stager) {
      // later on we could display multiple files, but at the moment,
      // i think it makes sense to just get the last one.
      const lastIndex = stager.downloads.length - 1;
      return downloadApi.getDownload(stager.downloads[lastIndex].id);
    },
    async deleteStager(item) {
      this.$emit("delete-stager", item);
    },
    getStagers() {
      this.stagerStore.getStagers();
    },
  },
};
</script>

<style></style>
