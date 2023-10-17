<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :close-on-click="false"
    bottom
    right
    transition="scale-transition"
    origin="top left"
  >
    <template #activator="{ on }">
      <v-chip
        :color="internalTag.color"
        text-color="white"
        class="mt-4 mr-1 ml-1 mb-4"
        :close="close"
        @click:close="deleteTag(internalTag)"
        v-on="on"
      >
        {{ `${tag.name}:${tag.value}` }}
        <v-icon v-if="customIcon" right>
          {{ customIcon }}
        </v-icon>
      </v-chip>
    </template>
    <v-card width="400" style="display: flex; flex-direction: row-reverse">
      <v-btn icon class="mt-2 mr-2" @click="menu = false">
        <v-icon>mdi-close-circle</v-icon>
      </v-btn>
      <v-form ref="form">
        <v-card-text>
          <v-text-field
            ref="nameField"
            v-model="internalTag.name"
            outlined
            dense
            label="Name"
            :rules="rules.noColon"
            required
          />
          <v-text-field
            v-model="internalTag.value"
            outlined
            dense
            label="Value"
            :rules="rules.noColon"
            required
          />
          <v-color-picker
            v-model="internalTag.color"
            hide-inputs
            dot-size="16"
            mode="hexa"
            swatches-max-height="100"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="green" text @click="updateTag(internalTag)">
            Update
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-menu>
</template>

<script>
export default {
  name: "TagChip",
  props: {
    isNew: {
      type: Boolean,
      default: false,
    },
    tag: {
      type: Object,
      default: () => ({ name: "New Tag", value: "", color: "#2196F3" }),
    },
    close: {
      type: Boolean,
      default: true,
    },
    customIcon: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      menu: false,
      internalTag: this.tag,
      rules: {
        noColon: [
          (value) => !!value || "Required.",
          (value) => !value.includes(":") || "Cannot contain a colon.",
        ],
      },
    };
  },
  watch: {
    menu(val) {
      if (val) {
        if (this.isNew) {
          this.internalTag = { name: "", value: "", color: "#2196F3" };
        }
        this.$nextTick(() => {
          this.$refs.form.resetValidation();

          // kind of lame, but it doesn't focus without the setTimeout
          setTimeout(() => {
            this.$refs.nameField.focus();
          }, 500);
        });
      } else {
        this.internalTag = this.tag;
      }
    },
  },
  methods: {
    deleteTag(tag) {
      this.$emit("delete-tag", tag);
    },
    updateTag(tag) {
      if (!this.$refs.form.validate()) {
        return;
      }
      this.$emit("update-tag", tag);
      this.menu = false;
      this.$refs.form.resetValidation();
    },
  },
};
</script>

<style></style>
