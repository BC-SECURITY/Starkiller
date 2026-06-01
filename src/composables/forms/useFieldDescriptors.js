import { computed, unref } from "vue";

const TYPE_MAP = {
  INTEGER: "number",
  FLOAT: "float",
  BOOLEAN: "boolean",
  STRING: "string",
  FILE: "file",
};

// Maps a backend value_type to the widget input type. Shared so consumers
// (GeneralForm via buildFieldDescriptors, AutoRunModules) can't drift apart.
export function mapValueType(valueType) {
  return TYPE_MAP[valueType] || "string";
}

// Pure: options object + priority array -> ordered descriptor array with `type`.
export function buildFieldDescriptors(options, priority = []) {
  const fields = Object.keys(options).map((key) => ({
    name: key,
    ...options[key],
  }));

  priority
    .slice()
    .reverse()
    .forEach((item) => {
      const index = fields.findIndex((f) => f.name === item);
      if (index > -1) {
        const fItem = fields.splice(index, 1)[0];
        fields.unshift(fItem);
      }
    });

  return fields.map((el) => ({
    ...el,
    type: mapValueType(el.value_type),
  }));
}

export function useFieldDescriptors(options, priority) {
  const allFields = computed(() =>
    buildFieldDescriptors(unref(options), unref(priority)),
  );
  return { allFields };
}
