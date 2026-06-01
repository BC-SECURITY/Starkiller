<template>
  <v-row
    :class="{ 'highlight-flash': flash }"
    @focusin="hasInteracted = true"
    @pointerdown="hasInteracted = true"
    @keydown="hasInteracted = true"
  >
    <v-col cols="6">
      <dynamic-form-input
        v-model="model"
        :suggested-values="suggestedValues"
        :strict="strict"
        :name="field.name"
        :rules="rules"
        :widget="widget"
        :error-messages="errorMessages"
        @update:model-value="onModelUpdate"
      />
    </v-col>
    <v-col cols="6">
      <v-list-subheader>{{ field.description }}</v-list-subheader>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref } from "vue";
import DynamicFormInput from "./DynamicFormInput.vue";

defineProps({
  field: { type: Object, required: true },
  widget: { type: Object, required: true },
  suggestedValues: { type: Array, default: () => [] },
  strict: { type: Boolean, default: false },
  rules: { type: Array, default: () => [] },
  errorMessages: { type: Array, default: () => [] },
  flash: { type: Boolean, default: false },
});
const emit = defineEmits(["clear"]);

const model = defineModel({ type: [String, Array, Number, Boolean] });

// Vuetify's multiselect/combobox can fire update:model-value during mount as
// they normalize their internal selection — without this gate, those emits
// would silently wipe a just-seeded server error before the user sees it.
// We arm the gate on any user-interaction event:
//   - focusin: text/select fields (bubbles, unlike focus)
//   - pointerdown: VSwitch clicks that toggle without focusing
//   - keydown: keyboard-only navigation (a11y)
const hasInteracted = ref(false);
function onModelUpdate() {
  if (hasInteracted.value) emit("clear");
}
</script>
