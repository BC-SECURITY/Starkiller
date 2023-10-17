<template>
  <v-dialog ref="agentUploadDialog" v-model="show" max-width="750px">
    <v-card>
      <v-card-title>
        <span class="headline">Upload To Agent</span>
      </v-card-title>
      <v-card-text>
        <p>Only showing files smaller than {{ formatBytes(maxBytes) }}</p>
        <file-input
          v-model="file"
          :rules="rules['fileInput']"
          :maximum-file-size="maxBytes"
          return-object
        />
        <v-text-field
          v-model="internalPathToFile"
          label="path/to/file (On the agent's machine)"
          :rules="rules['pathToFile']"
          outlined
          dense
          required
          :disabled="!file"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="blue darken-1" text @click.stop="show = false">
          Close
        </v-btn>
        <v-btn
          color="blue darken-1"
          text
          :loading="loading"
          :disabled="submitDisabled"
          @click="submit"
        >
          Upload
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import FileInput from "@/components/FileInput.vue";
import formatBytes from "@/utils/format-bytes";

const MAX_BYTES = 1048576;

export default {
  components: { FileInput },
  props: {
    value: Boolean,
    language: {
      type: String,
      default: "",
    },
    loading: {
      type: Boolean,
      default: false,
    },
    pathToFile: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      formatBytes,
      maxBytes: MAX_BYTES,
      descriptionLimit: 80,
      entries: [],
      internalPathToFile: this.pathToFile,
      file: null,
      rules: {
        pathToFile: [(v) => !!v || "PathToFile is required"],
        fileInput: [
          (v) => !!v || "File required",
          (v) =>
            (!!v && v.size < MAX_BYTES) ||
            `Maximum size of ${Math.floor(MAX_BYTES / 1e6)} MiB.`,
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
        this.$emit("input", value);
      },
    },
    fileName() {
      return this.file ? this.file.filename : "";
    },
    fileId() {
      return this.file ? this.file.id : "";
    },
    submitDisabled() {
      return !this.file || !this.internalPathToFile || this.loading;
    },
  },
  watch: {
    pathToFile(val) {
      this.internalPathToFile = val;
    },
    value(val) {
      if (val === false) {
        this.file = null;
        this.internalPathToFile = null;
      }
    },
    fileName(val) {
      if (val) {
        if (["python", "ironpython"].includes(this.language.toLowerCase())) {
          // always use the passed in pathToFile if it exists
          if (this.pathToFile) {
            this.internalPathToFile =
              this.addTrailingSlash(this.pathToFile) + val;
          } else {
            this.internalPathToFile = `/tmp/${val}`;
          }
        } else if (
          ["powershell", "csharp"].includes(this.language.toLowerCase())
        ) {
          if (this.pathToFile) {
            this.internalPathToFile =
              this.addTrailingSlash(this.pathToFile) + val;
          } else {
            this.internalPathToFile = `C:\\tmp\\${val}`;
          }
        }
      }
    },
  },
  methods: {
    addTrailingSlash(val) {
      if (val.endsWith("/") || val.endsWith("\\")) {
        return val;
      }
      if (["python", "ironpython"].includes(this.language.toLowerCase())) {
        return `${val}/`;
      }

      // todo need to test csharp and powershell agents for slash types
      return `${val}\\`;
    },
    async submit() {
      this.$emit("submit", {
        file: this.fileId,
        pathToFile: this.internalPathToFile,
      });
    },
  },
};
</script>
