// e2e/fixtures/modules.js
// Fields reflect ModulesTable.vue: id, name, language, description,
// needs_admin, opsec_safe, background, techniques.
// enabled: true is required by AgentExecuteModule's filter(el => el.enabled).
export const defaultModules = [
  {
    id: "powershell_collection_screenshot",
    name: "powershell_collection_screenshot",
    language: "powershell",
    description: "Takes a screenshot",
    needs_admin: false,
    opsec_safe: false,
    background: false,
    enabled: true,
    techniques: [],
    options: {
      Agent: { value: "", required: true, description: "Agent" },
    },
  },
  {
    id: "python_collection_linux_pillage",
    name: "python_collection_linux_pillage",
    language: "python",
    description: "Linux pillage",
    needs_admin: false,
    opsec_safe: false,
    background: false,
    enabled: true,
    techniques: [],
    options: {
      Agent: { value: "", required: true, description: "Agent" },
    },
  },
  {
    id: "powershell_situational_awareness",
    name: "powershell_situational_awareness",
    language: "powershell",
    description: "Situational awareness",
    needs_admin: false,
    opsec_safe: false,
    background: false,
    enabled: true,
    techniques: [],
    options: {
      Agent: { value: "", required: true, description: "Agent" },
    },
  },
];
