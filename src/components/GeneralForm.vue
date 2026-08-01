<template>
  <v-form ref="formRef" v-model="valid" :readonly="readonly" @submit.prevent>
    <v-alert
      v-if="formLevelMessages.length > 0"
      type="warning"
      prominent
      class="mb-4"
    >
      <div v-for="(msg, i) in formLevelMessages" :key="i">{{ msg }}</div>
    </v-alert>

    <form-field-row
      v-for="field in requiredFields"
      :key="field.name"
      v-model="form[field.name]"
      :field="field"
      :widget="widgetByField[field.name]"
      :suggested-values="suggestedValuesFor(field)"
      :strict="strictFor(field)"
      :rules="rules[field.name]"
      :error-messages="messagesFor(field.name)"
      :flash="recentlyVisibleFields.includes(field.name)"
      @clear="clearField(field.name)"
    />

    <template v-if="optionalFields.length > 0">
      <v-list-subheader>Optional Fields</v-list-subheader>
      <v-divider class="mb-8" />
    </template>

    <form-field-row
      v-for="field in optionalFields"
      :key="field.name"
      v-model="form[field.name]"
      :field="field"
      :widget="widgetByField[field.name]"
      :suggested-values="suggestedValuesFor(field)"
      :strict="strictFor(field)"
      :rules="rules[field.name]"
      :error-messages="messagesFor(field.name)"
      :flash="recentlyVisibleFields.includes(field.name)"
      @clear="clearField(field.name)"
    />
  </v-form>
</template>

<script setup>
import { ref, computed, watch, toRef } from "vue";
import FormFieldRow from "./FormFieldRow.vue";
import { useFieldDescriptors } from "@/composables/forms/useFieldDescriptors";
import { useFieldVisibility } from "@/composables/forms/useFieldVisibility";
import { useFieldCoercion } from "@/composables/forms/useFieldCoercion";
import {
  useSuggestedValues,
  shouldSeedBypasses,
} from "@/composables/forms/useSuggestedValues";
import { useServerErrors } from "@/composables/forms/useServerErrors";
import { resolveWidget } from "@/composables/forms/resolveWidget";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  options: { type: Object, required: true },
  readonly: { type: Boolean, default: false },
  priority: { type: Array, default: () => [] },
  serverErrors: { type: [Array, String, Object], default: null },
});
const emit = defineEmits(["update:modelValue"]);

const form = ref({});
const valid = ref(true);
const formRef = ref(null);

const { allFields } = useFieldDescriptors(
  toRef(props, "options"),
  toRef(props, "priority"),
);
const { suggestedValuesFor, strictFor, defaultBypasses } = useSuggestedValues();
const { isFieldVisible, recentlyVisibleFields, updateVisibility } =
  useFieldVisibility(allFields);
const { buildInitialForm, serializeForm } = useFieldCoercion();

// One descriptor per field, shared by render + error routing (avoids drift).
const widgetByField = computed(() => {
  const map = {};
  allFields.value.forEach((field) => {
    map[field.name] = resolveWidget({
      name: field.name,
      type: field.type,
      strict: strictFor(field),
      suggestedValues: suggestedValuesFor(field),
    });
  });
  return map;
});
// Only renderable fields (visible AND with a boolean `required`) get a kind
// entry. A hidden field's error then hits routeErrorsByKind's "kind unknown"
// fail-safe and surfaces in the banner with the field-name prefix instead of
// being routed inline to a FormFieldRow that the template never renders —
// otherwise a 422 against a depends_on-hidden field disappears entirely.
function isRenderable(field) {
  return (
    (field.required === true || field.required === false) &&
    isFieldVisible(field)
  );
}
const kindByField = computed(() => {
  const map = {};
  allFields.value.forEach((field) => {
    if (isRenderable(field)) {
      map[field.name] = widgetByField.value[field.name].kind;
    }
  });
  return map;
});
const knownFieldNames = computed(() => allFields.value.map((f) => f.name));

const { messagesFor, formLevelMessages, clearField } = useServerErrors({
  serverErrors: toRef(props, "serverErrors"),
  knownFieldNames,
  kindByField,
});

const requiredFields = computed(() =>
  allFields.value.filter((f) => f.required === true && isFieldVisible(f)),
);
const optionalFields = computed(() =>
  allFields.value.filter((f) => f.required === false && isFieldVisible(f)),
);
const rules = computed(() =>
  allFields.value.reduce((map, field) => {
    if (isFieldVisible(field)) {
      map[field.name] = [];
      if (field.required === true) {
        map[field.name].push((v) => !!v || `${field.name} is required`);
      }
    }
    return map;
  }, {}),
);

// Seed Bypasses with the store's defaults the first time both the form has a
// Bypasses slot AND the defaults have resolved. One-shot per form rebuild —
// re-armed when props.options changes so a fresh template gets fresh defaults.
//
// Side effect: this mutation feeds update:modelValue. When defaults resolve
// asynchronously (the common case) the seed runs after the deep `form` watch
// below is registered, so the mutation triggers that watch and it emits.
// During initial setup the seed runs before that watch exists, so the initial
// emit instead comes from the watch's own `immediate` callback reading the
// seeded form (see below). Either way the emit is programmatic (setup, not
// user input) — a future parent tracking a dirty-state flag should account for
// it.
let bypassDefaultsSeeded = false;
function trySeedBypassDefaults() {
  if (bypassDefaultsSeeded) return;
  if (!shouldSeedBypasses(form.value, defaultBypasses.value)) return;
  form.value.Bypasses = [...defaultBypasses.value];
  bypassDefaultsSeeded = true;
}

watch(
  () => props.options,
  () => {
    form.value = buildInitialForm(allFields.value);
    updateVisibility(form.value, true);
    bypassDefaultsSeeded = false;
    trySeedBypassDefaults();
  },
  { immediate: true },
);

// Defaults usually arrive async, after the form is already built. Re-attempt
// the seed when they do. `immediate: true` is harmless — if the options
// watch above already seeded, the bypassDefaultsSeeded guard no-ops this
// call; otherwise it covers the warm-store case (Pinia cache survives
// navigation, so defaults are already populated at mount).
watch(defaultBypasses, trySeedBypassDefaults, { immediate: true });

// `immediate: true` is load-bearing. The options watch above (also immediate)
// builds form.value during setup, BEFORE this watch is registered, so a plain
// (non-immediate) watch never observes that initial build and the parent's
// v-model stays {} until the first user edit. Submitting / re-enabling / killing
// an unedited form would then POST `options: {}`. Because this watch is declared
// after the options watch, its immediate callback runs against the
// already-built form and emits it exactly once at mount.
watch(
  form,
  (val) => {
    updateVisibility(val);
    emit("update:modelValue", serializeForm(val));
  },
  { deep: true, immediate: true },
);

// <script setup> is closed by default; parents call validate() via this ref to
// block submit, so it must be exposed. Load-bearing — do not remove.
async function validate() {
  const { valid: isValid } = await formRef.value.validate();
  return isValid;
}
defineExpose({ validate });
</script>

<style scoped>
.highlight-flash {
  animation: flash 1s ease-in-out;
}

@keyframes flash {
  0% {
  }
  50% {
    opacity: 1;
    background-color: #676767;
    box-shadow: 0 0 5px 5px #676767;
  }
  100% {
  }
}
</style>
