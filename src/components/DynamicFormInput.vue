<template>
  <div>
    <file-input v-if="widget.kind === 'file'" v-model="model" :label="name" />

    <v-autocomplete
      v-else-if="widget.kind === 'cred'"
      v-model="model"
      :items="suggestedValues"
      :label="name"
      :error-messages="errorMessages"
      variant="outlined"
      density="compact"
      item-value="id"
      item-title="id"
    >
      <template #item="{ internalItem: item, props: itemProps }">
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

    <component :is="resolvedComponent" v-else v-bind="bind" v-model="model" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import FileInput from "@/components/FileInput.vue";
import { KIND_TO_COMPONENT } from "@/composables/forms/kindToComponent";

// Kinds rendered by the generic <component :is> that take a list of items.
const LIST_KINDS = ["multiselect", "agent", "combobox", "select"];

const props = defineProps({
  suggestedValues: { type: Array, default: () => [] },
  strict: { type: Boolean, default: false },
  name: { type: String, required: true },
  rules: { type: Array, default: () => [] },
  errorMessages: { type: Array, default: () => [] },
  // Precomputed by the parent (GeneralForm or AutoRunModules). Don't resolve
  // here — the parent owns the single resolveWidget call so any maps it
  // derives (e.g. GeneralForm's kindByField, which useServerErrors uses for
  // file routing) can't drift from what's rendered.
  widget: { type: Object, required: true },
});

const model = defineModel({ type: [String, Array, Number, Boolean] });

const resolvedComponent = computed(() => KIND_TO_COMPONENT[props.widget.kind]);

const bind = computed(() => {
  const b = { label: props.name, ...props.widget.props };
  if (LIST_KINDS.includes(props.widget.kind)) b.items = props.suggestedValues;
  // file/cred handled above; generic kinds all support error-messages.
  b["error-messages"] = props.errorMessages;
  if (props.widget.kind === "text") b.rules = props.rules;
  return b;
});

function truncate(msg) {
  if (msg) {
    return msg.length > 80 ? `${msg.substr(0, 80)}...` : msg;
  }
  return "";
}
</script>
