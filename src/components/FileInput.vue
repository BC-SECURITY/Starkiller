<template>
  <div>
    <file-upload-dialog
      v-model="showDialog"
      :rules="rules"
      @submit="fileUploaded"
    />
    <v-autocomplete
      v-model="internalValue"
      :items="fileItems"
      :loading="isLoading"
      :search-input.sync="search"
      hide-no-data
      hide-selected
      clearable
      cache-items
      item-text="description"
      item-value="id"
      :label="label"
      placeholder="Start typing to Search"
      prepend-icon="fa-upload"
      outlined
      dense
      :return-object="returnObject"
      @click:prepend="showDialog = true"
    />
  </div>
</template>

<script>
import * as downloadApi from "@/api/download-api";
import FileUploadDialog from "@/components/FileUploadDialog.vue";
import formatBytes from "@/utils/format-bytes";

export default {
  components: { FileUploadDialog },
  props: {
    value: {
      type: [String, Array, Number],
      required: true,
    },
    label: {
      type: String,
      default: "Server Files",
    },
    rules: {
      type: Array,
      default: () => [],
    },
    maximumFileSize: {
      type: Number,
      required: false,
      default: -1,
    },
    returnObject: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      internalValue: this.value,
      isLoading: false,
      count: 0,
      entries: [],
      search: null,
      showDialog: false,
    };
  },
  computed: {
    fileItems() {
      return this.entries.map((entry) => {
        const description =
          entry.location.length > this.descriptionLimit
            ? `(${formatBytes(entry.size)}) ${entry.location.slice(
                0,
                this.descriptionLimit,
              )}...`
            : `(${formatBytes(entry.size)}) ${entry.location}`;

        return { ...entry, description };
      });
    },
  },
  watch: {
    internalValue(val) {
      this.$emit("input", val);
    },
    value(val) {
      this.internalValue = val;
    },
    search() {
      this.doSearch();
    },
  },
  mounted() {
    this.doSearch();
  },
  methods: {
    doSearch(force = true) {
      // For now we're just ignoring the search value and loading all the files.
      // If we find that this is slow we can make the autocomplete more complicated.
      // Items have already been loaded
      if (!force && this.fileItems.length > 0) return;

      // Items have already been requested
      if (this.isLoading) return;

      this.isLoading = true;

      // Lazily load input items
      downloadApi
        .getDownloads({ page: 1, limit: -1 })
        .then((res) => {
          const { records } = res;

          // Filter out files that are too large
          if (this.maximumFileSize > 0) {
            this.entries = records.filter(
              (entry) => entry.size <= this.maximumFileSize,
            );
          } else {
            this.entries = records;
          }
          this.count = this.entries.length;
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    fileUploaded({ file }) {
      this.showDialog = false;
      this.doSearch(true);
      if (this.returnObject) {
        this.internalValue = file;
      } else {
        this.internalValue = file.id;
      }
    },
  },
};
</script>

<style></style>
