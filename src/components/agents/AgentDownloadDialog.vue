<template>
  <v-dialog ref="downloadDialog" v-model="show" max-width="500px">
    <v-card>
      <v-card-title>
        <span class="headline">Download</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form" @submit.prevent>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="pathToFile"
                  label="path/to/file"
                  :rules="rules['pathToFile']"
                  variant="outlined"
                  density="compact"
                  required
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
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    modelValue: Boolean,
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "submit"],
  data() {
    return {
      pathToFile: "",
      rules: {
        pathToFile: [(v) => !!v || "PathToFile is required"],
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
  },
  watch: {
    modelValue(val) {
      if (val === false) {
        this.$refs.form.reset();
      }
    },
  },
  methods: {
    async submit() {
      const { valid } = await this.$refs.form.validate();
      if (!valid) return;

      this.$emit("submit", { pathToFile: this.pathToFile });
    },
  },
};
</script>
