<template>
  <v-dialog
    ref="uploadDialog"
    v-model="show"
    max-width="750px"
  >
    <v-card>
      <v-card-title>
        <span class="headline">Upload</span>
      </v-card-title>
      <v-card-text>
        <v-form
          ref="form"
          on-submit="return false;"
          @submit.prevent
        >
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-radio-group
                  v-model="uploadType"
                  mandatory
                  row
                >
                  <v-radio
                    value="uploadnew"
                    label="Upload New File"
                  />
                  <v-radio
                    value="useexisting"
                    label="Use Existing File"
                  />
                </v-radio-group>
                <v-file-input
                  v-if="uploadType === 'uploadnew'"
                  ref="fileInput"
                  v-model="file"
                  accept="*/*"
                  :rules="rules['fileInput']"
                />
                <v-autocomplete
                  v-else
                  v-model="selectedDownload"
                  :items="items"
                  :loading="isLoading"
                  :search-input.sync="search"
                  :rules="rules['selectedDownload']"
                  hide-no-data
                  hide-selected
                  cache-items
                  item-text="description"
                  item-value="filename"
                  label="Server Files"
                  placeholder="Start typing to Search"
                  prepend-icon="mdi-database-search"
                  return-object
                  outlined
                  dense
                />
                <v-text-field
                  v-model="internalPathToFile"
                  label="path/to/file (On the agent's machine)"
                  :rules="rules['pathToFile']"
                  outlined
                  dense
                  required
                />
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="blue darken-1"
          text
          @click.stop="show = false"
        >
          Close
        </v-btn>
        <v-btn
          color="blue darken-1"
          text
          :loading="loading"
          @click="submit"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as downloadApi from '@/api/download-api';

const MAX_BYTES = 1048576;

export default {
  props: {
    value: Boolean,
    language: {
      type: String,
      default: '',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    pathToFile: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      uploadType: 'uploadnew',
      isLoading: false,
      descriptionLimit: 80,
      selectedDownload: {},
      search: null,
      entries: [],
      internalPathToFile: this.pathToFile,
      file: null,
      rules: {
        pathToFile: [
          (v) => !!v || 'PathToFile is required',
        ],
        fileInput: [
          (v) => !!v || 'File required',
          (v) => (!!v && v.size < MAX_BYTES) || `Maximum size of ${Math.floor(MAX_BYTES / 1e6)} MiB.`,
        ],
        selectedDownload: [
          (v) => !!v || 'File required',
          (v) => (!!v && v.size < MAX_BYTES) || `Maximum size of ${Math.floor(MAX_BYTES / 1e6)} MiB.`,
        ],
      },
    };
  },
  computed: {
    show: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit('input', value);
      },
    },
    fileName() {
      return this.file ? this.file.name : '';
    },
    items() {
      return this.entries.map((entry) => {
        const description = entry.location.length > this.descriptionLimit
          ? `(${this.formatBytes(entry.size)}) ${entry.location.slice(0, this.descriptionLimit)}...`
          : `(${this.formatBytes(entry.size)}) ${entry.location}`;

        return { ...entry, description };
      });
    },
  },
  watch: {
    pathToFile(val) {
      this.internalPathToFile = val;
    },
    value(val) {
      if (val === false) {
        this.$refs.form.reset();
      }
    },
    file(val) {
      if (val) {
        if (this.language === 'python') {
          if (!this.internalPathToFile || this.internalPathToFile.length === 0) {
            this.internalPathToFile = `/tmp/${val.name}`;
          } else if (this.internalPathToFile.endsWith('/')) {
            this.internalPathToFile += val.name;
          } else {
            this.internalPathToFile = `/tmp/${val.name}`;
          }
        } else if (this.language === 'powershell') {
          if (!this.internalPathToFile || this.internalPathToFile.length === 0) {
            this.internalPathToFile = `C:\\tmp\\${val.name}`;
          } else if (this.internalPathToFile.endsWith('/') || this.internalPathToFile.endsWith('\\')) {
            this.internalPathToFile += val.name;
          } else {
            this.internalPathToFile = `C:\\tmp\\${val.name}`;
          }
        }
      }
    },
    selectedDownload(val) {
      if (val) {
        const { filename } = val;
        if (this.language === 'python') {
          if (!this.internalPathToFile || this.internalPathToFile.length === 0) {
            this.internalPathToFile = `/tmp/${filename}`;
          } else if (this.internalPathToFile.endsWith('/')) {
            this.internalPathToFile += filename;
          } else {
            this.internalPathToFile = `/tmp/${filename}`;
          }
        } else if (this.language === 'powershell') {
          if (!this.internalPathToFile || this.internalPathToFile.length === 0) {
            this.internalPathToFile = `C:\\tmp\\${filename}`;
          } else if (this.internalPathToFile.endsWith('/') || this.internalPathToFile.endsWith('\\')) {
            this.internalPathToFile += filename;
          } else {
            this.internalPathToFile = `C:\\tmp\\${filename}`;
          }
        }
      }
    },
    search() {
      // For now we're just ignoring the search value and loading all the files.
      // If we find that this is slow we can make the autocomplete more complicated.
      // Items have already been loaded
      if (this.items.length > 0) return;

      // Items have already been requested
      if (this.isLoading) return;

      this.isLoading = true;

      // Lazily load input items
      downloadApi.getDownloads({ page: 1, limit: -1 })
        .then((res) => {
          const { total, records } = res;
          this.count = total;
          this.entries = records;
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => { this.isLoading = false; });
    },
  },
  methods: {
    async submit() {
      if (!this.$refs.form.validate()) { return; }

      // todo if uploading a new file, do it here and then emit
      let fileId = null;
      if (this.uploadType === 'uploadnew') {
        const formData = new FormData();
        formData.append('file', this.file);

        const response = await downloadApi.createDownload(formData);
        fileId = response.data.id;
      } else {
        fileId = this.selectedDownload.id;
      }

      // otherwise emit the file id
      this.$emit('submit', { file: fileId, pathToFile: this.internalPathToFile });
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
