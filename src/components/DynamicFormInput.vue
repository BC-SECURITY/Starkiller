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
      color="primary"
      false-value="False"
      true-value="True"
      :label="name"
    />

    <v-autocomplete
      v-else-if="name === 'Bypasses'"
      v-model="internalValue"
      :items="suggestedValues"
      :label="name"
      variant="outlined"
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
      variant="outlined"
      density="compact"
      item-value="session_id"
      item-title="name"
    />

    <v-autocomplete
      v-else-if="name === 'CredID'"
      v-model="internalValue"
      :items="suggestedValues"
      :label="name"
      variant="outlined"
      density="compact"
      item-value="id"
      item-title="id"
    >
      <template #item="{ item, props: itemProps }">
        <v-list-item v-bind="itemProps">
          <v-list-item-title>
            {{
              truncate(
                `${item.raw.username}, ${item.raw.domain}, ${item.raw.password}`,
              )
            }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ truncate(`id: ${item.raw.id}, notes: ${item.raw.notes}`) }}
          </v-list-item-subtitle>
        </v-list-item>
      </template>
    </v-autocomplete>

    <v-combobox
      v-else-if="suggestedValues.length > 0 && !strict"
      v-model="internalValue"
      :items="suggestedValues"
      :label="name"
      variant="outlined"
      density="compact"
    />

    <v-autocomplete
      v-else-if="suggestedValues.length > 0 && strict"
      v-model="internalValue"
      :items="suggestedValues"
      :label="name"
      variant="outlined"
      density="compact"
    />

    <v-text-field
      v-else
      v-model="internalValue"
      :rules="rules"
      :label="name"
      :type="type === 'string' ? 'text' : 'number'"
      variant="outlined"
      density="compact"
      required
    />
  </div>
</template>

<script>
import FileInput from "@/components/FileInput.vue";

export default {
  components: { FileInput },
  props: {
    modelValue: {
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
  emits: ["update:modelValue"],
  data() {
    return {
      internalValue: this.modelValue,
    };
  },
  watch: {
    modelValue(val) {
      this.internalValue = val;
    },
    internalValue(val) {
      this.$emit("update:modelValue", val);
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
