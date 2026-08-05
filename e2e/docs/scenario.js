// e2e/docs/scenario.js
//
// Demo dataset for documentation screenshots. Deliberately separate from
// e2e/fixtures/, which exists to test behavior and renders sparse tables
// (DESKTOP-1 / user1 / ABC12345).
//
// Two rules this file exists to enforce:
//
// 1. Timestamps are ALWAYS derived from FROZEN_TIME, never literal. The browser
//    clock is pinned to FROZEN_TIME during capture; a literal date later than it
//    renders as "in 3 months" in DateTimeDisplay.vue's fromNow() with no error.
//
// 2. Data is unmistakably synthetic. This is a C2 framework's public
//    documentation: RFC 5737 addresses (192.0.2.0/24) and example.com only, so a
//    screenshot can never be mistaken for real infrastructure.

export const FROZEN_TIME = new Date("2026-06-15T14:30:00Z");

const minutesAgo = (m) =>
  new Date(FROZEN_TIME.getTime() - m * 60_000).toISOString();
const hoursAgo = (h) => minutesAgo(h * 60);
const daysAgo = (d) => hoursAgo(d * 24);

export const scenario = {
  listeners: [
    {
      id: 1,
      name: "http-primary",
      enabled: true,
      module: "http",
      listener_type: "http",
      template: "http",
      options: { Host: "http://192.0.2.10", Port: "443" },
      tags: [],
      created_at: daysAgo(2),
    },
    {
      id: 2,
      name: "smb-pivot",
      enabled: true,
      module: "smb",
      listener_type: "smb",
      template: "smb",
      options: { PipeName: "acme-svc" },
      tags: [],
      created_at: daysAgo(1),
    },
  ],

  agents: [
    {
      session_id: "K3H8P2WQ",
      name: "K3H8P2WQ",
      hostname: "WIN-DC01",
      username: "ACME\\Administrator",
      high_integrity: true,
      process_name: "powershell.exe",
      process_id: 4812,
      language: "powershell",
      language_version: "5.1",
      architecture: "x64",
      listener: "http-primary",
      os_details: "Windows Server 2022",
      internal_ip: "192.0.2.10",
      external_ip: "192.0.2.1",
      delay: 5,
      jitter: 0.2,
      archived: false,
      stale: false,
      tags: [],
      checkin_time: hoursAgo(6),
      lastseen_time: minutesAgo(1),
    },
    {
      session_id: "M7QX4LZB",
      name: "M7QX4LZB",
      hostname: "WIN-WS07",
      username: "ACME\\j.mercer",
      high_integrity: false,
      process_name: "powershell.exe",
      process_id: 2264,
      language: "powershell",
      language_version: "5.1",
      architecture: "x64",
      listener: "http-primary",
      os_details: "Windows 11",
      internal_ip: "192.0.2.41",
      external_ip: "192.0.2.1",
      delay: 5,
      jitter: 0.2,
      archived: false,
      stale: false,
      tags: [],
      checkin_time: hoursAgo(4),
      lastseen_time: minutesAgo(2),
    },
    {
      // AgentExecuteModule.vue's compatibleModules computed intersects each
      // selected agent's language (powershell/csharp/bof share a group,
      // python is its own); a module-tasking shot that selects 3 agents
      // needs 3 agents in the same group or it renders a red "No modules
      // are compatible with all selected agents" banner instead of a
      // working demo. K3H8P2WQ and M7QX4LZB are the only other powershell
      // agents, so this one exists to make a same-language trio possible.
      session_id: "T4LM9XRP",
      name: "T4LM9XRP",
      hostname: "WIN-FIN03",
      username: "ACME\\s.patel",
      high_integrity: false,
      process_name: "powershell.exe",
      process_id: 6120,
      language: "powershell",
      language_version: "5.1",
      architecture: "x64",
      listener: "http-primary",
      os_details: "Windows 10",
      internal_ip: "192.0.2.57",
      external_ip: "192.0.2.1",
      delay: 5,
      jitter: 0.2,
      archived: false,
      stale: false,
      tags: [],
      checkin_time: hoursAgo(2),
      lastseen_time: minutesAgo(3),
    },
    {
      session_id: "R9TF6NCV",
      name: "web-pivot",
      hostname: "ubuntu-web1",
      username: "svc_deploy",
      high_integrity: false,
      process_name: "python3",
      process_id: 18033,
      language: "python",
      language_version: "3.11",
      architecture: "x64",
      listener: "http-primary",
      os_details: "Ubuntu 22.04",
      internal_ip: "192.0.2.88",
      external_ip: "192.0.2.1",
      delay: 10,
      jitter: 0.3,
      archived: false,
      stale: false,
      tags: [],
      checkin_time: hoursAgo(3),
      lastseen_time: minutesAgo(4),
    },
    {
      session_id: "D2VB5JYK",
      name: "D2VB5JYK",
      hostname: "MAC-DESIGN2",
      username: "a.chen",
      high_integrity: false,
      process_name: "python3",
      process_id: 9471,
      language: "python",
      language_version: "3.12",
      architecture: "arm64",
      listener: "http-primary",
      os_details: "macOS 14",
      internal_ip: "192.0.2.103",
      external_ip: "192.0.2.1",
      delay: 30,
      jitter: 0.5,
      archived: false,
      stale: true,
      tags: [],
      checkin_time: daysAgo(1),
      lastseen_time: hoursAgo(9),
    },
  ],

  // enabled: true is required — AgentExecuteModule filters on it.
  modules: [
    {
      id: "powershell_situational_awareness_host_processes",
      name: "powershell_situational_awareness_host_processes",
      language: "powershell",
      description: "Enumerates running processes on the host.",
      needs_admin: false,
      opsec_safe: true,
      background: false,
      enabled: true,
      techniques: ["T1057"],
      options: {
        Agent: { value: "", required: true, description: "Agent to run on." },
      },
    },
    {
      id: "powershell_credentials_mimikatz_logonpasswords",
      name: "powershell_credentials_mimikatz_logonpasswords",
      language: "powershell",
      description: "Dumps credentials from LSASS.",
      needs_admin: true,
      opsec_safe: false,
      background: false,
      enabled: true,
      techniques: ["T1003"],
      options: {
        Agent: { value: "", required: true, description: "Agent to run on." },
      },
    },
    {
      id: "python_collection_linux_pillage",
      name: "python_collection_linux_pillage",
      language: "python",
      description: "Collects files of interest from a Linux host.",
      needs_admin: false,
      opsec_safe: true,
      background: true,
      enabled: true,
      techniques: ["T1005"],
      options: {
        Agent: { value: "", required: true, description: "Agent to run on." },
      },
    },
  ],

  // user_id: 1 is required — setFakeAuth sets filterOnlyMyStagers: true, and
  // StagersTable hides stagers not owned by the current user (id 1).
  //
  // created_at is required too: StagersTable.vue's "Created At" column feeds
  // it straight to <date-time-display>, which does no fallback for a missing
  // value — DateTimeDisplay.vue logs a Vue prop-type warning and its fromNow()
  // resolves undefined to "now", so an omitted field silently renders as "a
  // few seconds ago" in the screenshot instead of failing loudly.
  stagers: [
    {
      id: 1,
      name: "acme-powershell-launcher",
      template: "multi_launcher",
      user_id: 1,
      options: { Listener: "http-primary", Language: "powershell" },
      created_at: hoursAgo(3),
    },
    {
      id: 2,
      name: "acme-macro",
      template: "windows_macro",
      user_id: 1,
      options: { Listener: "http-primary", Language: "powershell" },
      created_at: hoursAgo(1),
    },
  ],

  // MalleableProfilesList.vue renders Name, Category and Updated At columns
  // (headers at MalleableProfilesList.vue:148-153). `name` must be a string on
  // every record — the search filter calls p.name.toLowerCase() unguarded.
  malleableProfiles: [
    {
      id: 1,
      name: "acme-amazon",
      category: "amazon",
      data: 'set sample_name "Amazon";\nset sleeptime "5000";\nset jitter "20";\n',
      updated_at: daysAgo(3),
    },
    {
      id: 2,
      name: "acme-onedrive",
      category: "onedrive",
      data: 'set sample_name "OneDrive";\nset sleeptime "8000";\nset jitter "35";\n',
      updated_at: daysAgo(1),
    },
  ],

  // ListenerEdit fetches the template list on mount, then the selected
  // template's detail. `http_malleable` carries a Profile option because
  // docs/listeners/malleable-c2.md's prose calls out the "Profiles dropdown"
  // as the one thing distinguishing it from the plain HTTP listener.
  listenerTemplates: [
    {
      id: "http",
      name: "http",
      description: "Starts a http[s] listener that uses a GET/POST approach.",
      options: {
        Name: {
          value: "http-primary",
          required: true,
          description: "Name for the listener.",
        },
        Host: {
          value: "http://192.0.2.10",
          required: true,
          description: "Hostname/IP for staging.",
        },
        Port: {
          value: "443",
          required: true,
          description: "Port for the listener.",
        },
        DefaultDelay: {
          value: "5",
          required: true,
          description: "Agent delay/reach back interval (in seconds).",
        },
        DefaultJitter: {
          value: "0.2",
          required: true,
          description: "Jitter in agent reachback interval (0.0-1.0).",
        },
      },
    },
    {
      id: "http_malleable",
      name: "http_malleable",
      description:
        "Starts a http[s] listener that adheres to a Malleable C2 profile.",
      options: {
        Name: {
          value: "malleable-amazon",
          required: true,
          description: "Name for the listener.",
        },
        Host: {
          value: "http://192.0.2.10",
          required: true,
          description: "Hostname/IP for staging.",
        },
        Port: {
          value: "443",
          required: true,
          description: "Port for the listener.",
        },
        Profile: {
          value: "acme-amazon",
          required: true,
          description: "Malleable C2 profile to use.",
          suggested_values: ["acme-amazon", "acme-onedrive"],
          strict: true,
        },
        DefaultDelay: {
          value: "5",
          required: true,
          description: "Agent delay/reach back interval (in seconds).",
        },
      },
    },
  ],

  // Matched by module_id against scenario.modules[].id — AutoRunModules renders
  // `${index + 1}. ${module.id}`, so an unmatched id renders "1. undefined".
  autorunTasks: [
    {
      module_id: "powershell_situational_awareness_host_processes",
      options: {},
    },
  ],

  // loaded: false is what makes PluginEdit render the dependency warning
  // (PluginEdit.vue:110 `<span v-if="!plugin.loaded">`). python_deps is
  // MANDATORY alongside it — pluginDepsMessage does this.plugin.python_deps
  // .length with no guard and throws on undefined.
  plugins: [
    {
      id: "basic_reporting",
      name: "basic_reporting",
      loaded: false,
      enabled: false,
      execution_enabled: false,
      authors: [],
      execution_options: {},
      settings_options: {},
      python_deps: ["twilio"],
    },
  ],

  // registries must be a non-null object — PluginMarketplace calls
  // Object.keys(plugin.registries) in registryOptions. versions must be a
  // non-empty array of objects with `name`: the selection watcher reads
  // selectedPluginObj.versions[0].name and throws otherwise.
  marketplace: [
    {
      name: "Basic Reporting",
      installed: false,
      installed_version: null,
      icon: null,
      registries: {
        "BC-SECURITY": {
          name: "BC-SECURITY",
          description:
            "Exports engagement data — sessions, credentials, chat log and the master log — as CSV.",
          authors: [
            { name: "BC Security", link: "https://example.com/bc-security" },
          ],
          homepage_url: "https://example.com/plugins/basic-reporting",
          source_url: "https://example.com/plugins/basic-reporting/source",
          versions: [{ name: "2.0.0" }],
        },
      },
    },
    {
      name: "Empire MCP",
      installed: true,
      installed_version: "1.1.0",
      icon: null,
      registries: {
        "BC-SECURITY": {
          name: "BC-SECURITY",
          description: "Exposes Empire to Model Context Protocol clients.",
          authors: [
            { name: "BC Security", link: "https://example.com/bc-security" },
          ],
          homepage_url: "https://example.com/plugins/empire-mcp",
          source_url: "https://example.com/plugins/empire-mcp/source",
          versions: [{ name: "1.1.0" }],
        },
      },
    },
  ],

  // NotificationBell renders item.title and item.text (NOT item.message), and
  // buttonText only when item.route is truthy — a route without buttonText
  // renders an empty button. At least one read: false is required or the bell
  // shows no badge.
  notifications: [
    {
      id: "n1",
      title: "New Agent",
      text: "New Agent 'R9TF6NCV' callback!",
      read: false,
      route: "/agents",
      buttonText: "VIEW",
      timestamp: minutesAgo(1),
    },
    {
      id: "n2",
      title: "New Listener",
      text: "New Listener 'http-primary' started!",
      read: true,
      route: "/listeners",
      buttonText: "VIEW",
      timestamp: hoursAgo(6),
    },
  ],
};
