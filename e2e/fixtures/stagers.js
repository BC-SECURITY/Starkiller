// e2e/fixtures/stagers.js
//
// user_id: 1 is required because setFakeAuth sets filterOnlyMyStagers: true,
// which filters the StagersTable to only show stagers owned by the current
// user (id: 1). Stagers missing user_id would be hidden.

export const defaultStagers = [
  {
    id: 1,
    name: "stager-1",
    template: "multi_launcher",
    user_id: 1,
    options: { Listener: "http-1", Language: "powershell" },
  },
];

export const launcherTemplate = {
  id: "multi_launcher",
  name: "multi_launcher",
  description: "Multi launcher",
  authors: [],
  comments: [],
  options: {
    Listener: { value: "", required: true, description: "Listener" },
    Language: {
      value: "powershell",
      required: true,
      description: "Language",
    },
  },
};
