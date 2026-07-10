<template>
  <v-dialog v-model="open" width="480">
    <v-card>
      <v-card-title>{{ tag ? "Edit Tag" : "New Tag" }}</v-card-title>
      <v-form ref="form">
        <v-card-text>
          <v-text-field
            v-model="form.name"
            label="Name"
            variant="outlined"
            density="compact"
            :rules="[(v) => !!v?.trim() || 'Required.']"
            required
          />
          <v-text-field
            v-model="form.description"
            label="Description"
            variant="outlined"
            density="compact"
          />
          <v-color-picker
            v-model="form.color"
            hide-inputs
            dot-size="16"
            mode="hexa"
            swatches-max-height="100"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="open = false">Cancel</v-btn>
          <v-btn color="green" variant="text" @click="save">Save</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "TagDialog",
  props: {
    modelValue: { type: Boolean, default: false },
    tag: { type: Object, default: null }, // null = create
  },
  emits: ["update:modelValue", "save"],
  data() {
    return { form: { name: "", color: "#2196F3", description: "" } };
  },
  computed: {
    open: {
      get() {
        return this.modelValue;
      },
      set(v) {
        this.$emit("update:modelValue", v);
      },
    },
  },
  watch: {
    modelValue(v) {
      if (v) {
        this.form = this.tag
          ? {
              name: this.tag.name,
              color: this.tag.color || "#2196F3",
              description: this.tag.description ?? "",
            }
          : { name: "", color: "#2196F3", description: "" };
        this.$nextTick(() => {
          if (this.$refs.form) this.$refs.form.resetValidation();
        });
      }
    },
  },
  methods: {
    async save() {
      const { valid } = await this.$refs.form.validate();
      if (!valid) return;
      this.$emit("save", { ...this.form, name: this.form.name.trim() });
    },
  },
};
</script>
