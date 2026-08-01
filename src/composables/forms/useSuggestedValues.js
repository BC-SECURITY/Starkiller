import { computed, onMounted, inject } from "vue";
import { useListenerStore } from "@/stores/listener-module";
import { useBypassStore } from "@/stores/bypass-module";
import { useCredentialStore } from "@/stores/credential-module";
import { useMalleableProfileStore } from "@/stores/malleable-module";
import { useAgentStore } from "@/stores/agent-module";

// Fields whose suggested values are authoritative — even if a backend
// descriptor says strict:false, the UI must render a strict widget (e.g.
// `select`) instead of a free-text combobox. Drift here silently downgrades
// validation, so keep it in sync with backend expectations.
const STRICT_FIELDS = ["Listener", "Bypasses", "Profile", "CredID"];

export function isStrictField(field) {
  return STRICT_FIELDS.includes(field.name) ? true : field.strict;
}

// Gate for seeding a form's Bypasses with the store's defaults. Only seeds
// when the form has a Bypasses slot AND the current value is "empty"
// (null/undefined, empty array, blank string) AND the defaults have resolved.
export function shouldSeedBypasses(form, defaults) {
  if (!form || !Object.prototype.hasOwnProperty.call(form, "Bypasses"))
    return false;
  if (!Array.isArray(defaults) || defaults.length === 0) return false;
  const current = form.Bypasses;
  return (
    current == null ||
    (Array.isArray(current) && current.length === 0) ||
    (typeof current === "string" && current.trim() === "")
  );
}

export function useSuggestedValues() {
  const agentStore = useAgentStore();
  const listenerStore = useListenerStore();
  const bypassStore = useBypassStore();
  const credentialStore = useCredentialStore();
  const malleableProfileStore = useMalleableProfileStore();

  // App.vue provides `snack`; default to null so the composable is safe to use
  // wherever it isn't provided (e.g. tests).
  const snack = inject("snack", null);

  const agents = computed(() => agentStore.agents);
  const listeners = computed(() => listenerStore.listenerNames);
  const bypasses = computed(() => bypassStore.mergedBypassNames);
  const defaultBypasses = computed(() => bypassStore.defaultBypassNames);
  const credentials = computed(() => credentialStore.credentials);
  const malleableProfiles = computed(() => malleableProfileStore.profileNames);

  function suggestedValuesFor(field) {
    if (field.name === "Agent") return agents.value;
    if (["Listener", "RedirectListener"].includes(field.name))
      return listeners.value;
    if (field.name === "Bypasses") return bypasses.value;
    if (field.name === "Profile") return malleableProfiles.value;
    if (field.name === "CredID") return credentials.value;
    return field.suggested_values;
  }

  onMounted(() => {
    // Fire-and-forget store loads. Catch each so a transient backend failure
    // surfaces (snackbar + console) instead of leaving a silently empty
    // dropdown and an unhandled promise rejection.
    const loads = [
      ["agents", agentStore.getAgents()],
      ["listeners", listenerStore.getListeners()],
      ["bypasses", bypassStore.getBypasses()],
      ["malleable profiles", malleableProfileStore.getMalleableProfiles()],
      ["credentials", credentialStore.getCredentials()],
    ];
    loads.forEach(([label, promise]) => {
      Promise.resolve(promise).catch((err) => {
        console.error(`Failed to load ${label} suggestions:`, err);
        if (snack) snack.error(`Failed to load ${label} suggestions.`);
      });
    });
  });

  return {
    suggestedValuesFor,
    strictFor: isStrictField,
    defaultBypasses,
  };
}
