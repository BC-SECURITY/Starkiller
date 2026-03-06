<template>
  <v-dialog ref="uploadDialog" v-model="show" max-width="750px">
    <v-card>
      <v-card-title>
        <span class="headline">Upload To Empire Server</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form" on-submit="return false;" @submit.prevent>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-file-input
                  ref="fileInput"
                  v-model="file"
                  accept="*/*"
                  :rules="rules"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-form>
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
          @click="submit"
        >
          Upload
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as downloadApi from "@/api/download-api";

export default {
  name: "FileUploadDialog",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    rules: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["update:modelValue", "submit"],
  data() {
    return {
      loading: false,
      file: null,
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
  },
  methods: {
    async submit() {
      const { valid } = await this.$refs.form.validate();
      if (!valid) return;

      const formData = new FormData();
      formData.append("file", this.file);

      const response = await downloadApi.createDownload(formData);

      this.$emit("submit", { file: response.data });
    },
  },
};
</script>

<style></style>
