import { ref, watch } from "vue";
import { normalizeServerErrors } from "./normalizeServerErrors";

// Widget kinds whose component cannot render Vuetify `error-messages`.
// FileInput.vue is a custom wrapper that does not forward attrs, so file
// errors are shown in the form-level banner instead.
const NON_RENDERABLE_KINDS = new Set(["file"]);

function prefixIfNeeded(name, msg) {
  // Skip the prefix when the backend message already leads with the field
  // name (FastAPI/Pydantic stringified validators frequently do this).
  // Case-insensitive so "Cert: ..." dedups against a field named "cert".
  const lead = `${name.toLowerCase()}:`;
  if (typeof msg === "string" && msg.toLowerCase().startsWith(lead)) return msg;
  return `${name}: ${msg}`;
}

export function routeErrorsByKind(normalized, kindByField) {
  const fields = {};
  const formLevel = [...normalized.formLevel];
  Object.keys(normalized.fields).forEach((name) => {
    const kind = kindByField[name];
    // Two reasons to route a field error into the banner instead of inline:
    //   - intentional: the kind is in NON_RENDERABLE_KINDS (currently `file`,
    //     because FileInput doesn't forward error-messages).
    //   - fail-safe: kind is unknown (field/kind map desync), so we can't
    //     trust the widget to render the error at all.
    // Either way, prepend the field name so the banner message keeps its
    // context — but dedup if the message already leads with the name.
    if (kind === undefined || NON_RENDERABLE_KINDS.has(kind)) {
      formLevel.push(
        ...normalized.fields[name].map((msg) => prefixIfNeeded(name, msg)),
      );
    } else {
      fields[name] = normalized.fields[name];
    }
  });
  return { fields, formLevel };
}

export function useServerErrors({
  serverErrors,
  knownFieldNames,
  kindByField,
}) {
  const fields = ref({});
  const formLevelMessages = ref([]);
  // Names the user dismissed via clearField. Re-routes (from a kindByField /
  // knownFieldNames change) must NOT re-derive these from `serverErrors`, or
  // edit-to-dismiss would silently un-dismiss when async store loads flip a
  // field's resolved widget. Cleared whenever `serverErrors` itself changes
  // (new submission gets a clean slate).
  const dismissed = new Set();

  function rebuild() {
    const detail = serverErrors.value;
    if (detail == null) {
      fields.value = {};
      formLevelMessages.value = [];
      return;
    }
    const normalized = normalizeServerErrors(detail, knownFieldNames.value);
    // Drop dismissed fields BEFORE routing — otherwise a later kind flip
    // (text -> file, or kind becomes unknown) would re-route them into the
    // always-visible banner, resurrecting the very errors the user just
    // dismissed inline. Filtering here keeps dismissals authoritative across
    // both the inline and banner surfaces.
    if (dismissed.size > 0) {
      normalized.fields = Object.fromEntries(
        Object.entries(normalized.fields).filter(
          ([name]) => !dismissed.has(name),
        ),
      );
    }
    const routed = routeErrorsByKind(normalized, kindByField.value);
    fields.value = routed.fields;
    formLevelMessages.value = routed.formLevel;
  }

  // Source-of-truth change: drop any prior dismissals and authoritatively
  // re-seed from the new errors.
  watch(
    serverErrors,
    () => {
      dismissed.clear();
      rebuild();
    },
    { immediate: true },
  );

  // Topology change: re-route the SAME errors against the new widget map
  // without forgetting user dismissals.
  watch([knownFieldNames, kindByField], rebuild);

  function messagesFor(name) {
    return fields.value[name] || [];
  }

  // Edit-to-dismiss: called only from user-input events, never from a
  // wholesale `form` reassignment. Goes through rebuild() so the pre-route
  // dismissal filter clears the field on *both* surfaces — inline and banner.
  // A file-kind error lives in formLevelMessages, so a direct mutation of
  // `fields.value` alone (the previous implementation) would silently leave
  // the banner entry untouched and the user's dismissal would do nothing.
  function clearField(name) {
    dismissed.add(name);
    rebuild();
  }

  return { messagesFor, formLevelMessages, clearField };
}
