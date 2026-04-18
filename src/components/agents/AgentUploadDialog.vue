<template>
  <v-dialog ref="agentUploadDialog" v-model="show" max-width="750px">
    <v-card>
      <v-card-title>
        <span class="headline">Upload To Agent</span>
      </v-card-title>
      <v-card-text>
        <file-input v-model="file" :rules="rules['fileInput']" return-object />
        <v-text-field
          v-model="internalPathToFile"
          label="path/to/file (On the agent's machine)"
          :rules="rules['pathToFile']"
          variant="outlined"
          density="compact"
          required
          :disabled="!file"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="blue-darken-1" variant="text" @click.stop="show = false">
          Close
        </v-btn>
        <v-btn
          color="blue-darken-1"
          variant="text"
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

export default {
  components: { FileInput },
  props: {
    modelValue: Boolean,
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
  emits: ["update:modelValue", "submit"],
  data() {
    return {
      descriptionLimit: 80,
      entries: [],
      internalPathToFile: this.pathToFile,
      file: null,
      rules: {
        pathToFile: [(v) => !!v || "PathToFile is required"],
        fileInput: [(v) => !!v || "File required"],
      },
    };
  },
  computed: {
    show: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
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
    modelValue(val) {
      if (val === false) {
        this.file = null;
        this.internalPathToFile = null;
      }
    },
    fileName(val) {
      if (val) {
        if (["python"].includes(this.language.toLowerCase())) {
          // always use the passed in pathToFile if it exists
          if (this.pathToFile) {
            this.internalPathToFile =
              this.addTrailingSlash(this.pathToFile) + val;
          } else {
            this.internalPathToFile = `/tmp/${val}`;
          }
        } else if (
          ["powershell", "csharp", "c", "ironpython", "go"].includes(
            this.language.toLowerCase(),
          )
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
      if (["python"].includes(this.language.toLowerCase())) {
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
