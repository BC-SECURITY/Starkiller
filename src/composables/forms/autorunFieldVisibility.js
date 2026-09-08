import { computeVisibility } from "@/composables/forms/useFieldVisibility";

// Pure: AutoRunModules edits a raw options dict (keyed by field name, each
// value carrying .value/.depends_on/etc - the same shape buildFieldDescriptors
// produces for GeneralForm). Given that dict, return the ordered field
// descriptors the options dialog should render: excluding the "agent" field
// (AutoRunModules never lets an autorun task pick its own agent) and any
// field whose depends_on isn't satisfied by the other fields' current values.
export function visibleAutorunFields(options) {
  const allFields = Object.keys(options).map((key) => ({
    name: key,
    ...options[key],
  }));
  const formValues = allFields.reduce((acc, field) => {
    acc[field.name] = field.value;
    return acc;
  }, {});
  const visibility = computeVisibility(allFields, formValues);

  return allFields
    .filter((field) => field.name.toLowerCase() !== "agent")
    .filter((field) => visibility[field.name] !== false);
}
