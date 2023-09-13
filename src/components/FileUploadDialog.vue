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
                  outlined
                  dense
                />
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="blue darken-1" text @click.stop="show = false">
          Close
        </v-btn>
        <v-btn color="blue darken-1" text :loading="loading" @click="submit">
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
  components: {},
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    rules: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      loading: false,
      file: null,
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
  },
  methods: {
    async submit() {
      if (!this.$refs.form.validate()) {
        return;
      }

      const formData = new FormData();
      formData.append("file", this.file);

      const response = await downloadApi.createDownload(formData);

      this.$emit("submit", { file: response.data });
    },
  },
};
</script>

<style></style>
