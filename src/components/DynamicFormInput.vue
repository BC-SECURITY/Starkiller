<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<template>
  <div>
    <v-switch
      v-if="
        suggestedValues.length > 0 &&
        strict &&
        suggestedValues.includes('True') &&
        suggestedValues.includes('False')
      "
      v-model="internalValue"
      false-value="False"
      true-value="True"
      :label="name"
    />

    <v-autocomplete
      v-else-if="name === 'Bypasses'"
      v-model="internalValue"
      :items="suggestedValues"
      :label="name"
      outlined
      multiple
      chips
    />

    <file-input
      v-else-if="type === 'file'"
      v-model="internalValue"
      :label="name"
    />

    <v-autocomplete
      v-else-if="name === 'Agent'"
      v-model="internalValue"
      :items="suggestedValues"
      :label="name"
      outlined
      dense
      item-value="session_id"
      item-text="name"
    />

    <v-autocomplete
      v-else-if="name === 'CredID'"
      v-model="internalValue"
      :items="suggestedValues"
      :label="name"
      outlined
      dense
      item-value="id"
      item-text="id"
    >
      <template #item="data">
        <v-list-item-content>
          <v-list-item-title
            v-text="
              truncate(
                `${data.item.username}, ${data.item.domain}, ${data.item.password}`,
              )
            "
          />
          <v-list-item-subtitle
            v-text="truncate(`id: ${data.item.id}, notes: ${data.item.notes}`)"
          />
        </v-list-item-content>
      </template>
    </v-autocomplete>

    <v-combobox
      v-else-if="suggestedValues.length > 0 && !strict"
      v-model="internalValue"
      :items="suggestedValues"
      :label="name"
      outlined
      dense
    />

    <v-autocomplete
      v-else-if="suggestedValues.length > 0 && strict"
      v-model="internalValue"
      :items="suggestedValues"
      :label="name"
      outlined
      dense
    />
    <v-text-field
      v-else
      v-model="internalValue"
      :rules="rules"
      :label="name"
      :type="type === 'string' ? 'text' : 'number'"
      outlined
      dense
      required
    />
  </div>
</template>

<script>
import FileInput from "@/components/FileInput.vue";

export default {
  components: { FileInput },
  props: {
    value: {
      type: [String, Array, Number],
      required: true,
    },
    suggestedValues: {
      type: Array,
      default: () => [],
    },
    strict: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: true,
    },
    rules: {
      type: Array,
      default: () => [],
    },
    type: {
      type: String,
      default: "text",
    },
  },
  data() {
    return {
      internalValue: this.value,
    };
  },
  watch: {
    internalValue(val) {
      this.$emit("input", val);
    },
  },
  methods: {
    truncate(msg) {
      if (msg) {
        return msg.length > 80 ? `${msg.substr(0, 80)}...` : msg;
      }
      return "";
    },
  },
};
</script>

<style></style>
