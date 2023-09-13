<template>
  <v-dialog ref="scriptImportDialog" v-model="show" max-width="750px">
    <v-card>
      <v-card-title>
        <span class="headline">Import Script</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form" on-submit="return false;" @submit.prevent>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-file-input
                  ref="fileInput"
                  v-model="file"
                  accept=".py,.js,.ps1"
                  :rules="rules['fileInput']"
                  label="Select Script"
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
          Import
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const MAX_BYTES = 1048576;

export default {
  props: {
    value: Boolean,
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      file: null,
      rules: {
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
  },
  watch: {
    value(val) {
      if (val === false) {
        this.$refs.form.reset();
      }
    },
  },
  methods: {
    async submit() {
      if (!this.$refs.form.validate()) {
        return;
      }
      this.$emit("submit", { file: this.file });
    },
  },
};
</script>
