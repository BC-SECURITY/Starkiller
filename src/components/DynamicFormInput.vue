<template>
  <div>
    <v-switch
      v-if="suggestedValues.length > 0
        && strict
        && suggestedValues.includes('True')
        && suggestedValues.includes('False')"
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
export default {
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
      default: 'text',
    },
  },
  data() {
    return {
      internalValue: this.value,
    };
  },
  watch: {
    internalValue(val) {
      this.$emit('input', val);
    },
  },
};
</script>

<style>

</style>
