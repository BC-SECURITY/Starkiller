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

  // AgentFileBrowser's root load calls getDirectory(sessionId, "/") → GET
  // /agents/{id}/files/root, whose response is { children: [...] }
  // (agent-api.js's getDirectory unwraps .children into the array the treeview
  // sorts). Each node needs is_file / name / id / path; transform() maps
  // is_file → `file` and gives folders `children: []` so they render
  // expandable. A missing/non-array children would throw in items.sort and
  // fall into the scrape path — so this must be a populated array.
  agentFiles: [
    { id: "C:\\Users", name: "Users", is_file: false, path: "C:\\Users" },
    { id: "C:\\Windows", name: "Windows", is_file: false, path: "C:\\Windows" },
    { id: "C:\\Temp", name: "Temp", is_file: false, path: "C:\\Temp" },
    {
      id: "C:\\loot.zip",
      name: "loot.zip",
      is_file: true,
      path: "C:\\loot.zip",
    },
    {
      id: "C:\\seatbelt-output.txt",
      name: "seatbelt-output.txt",
      is_file: true,
      path: "C:\\seatbelt-output.txt",
    },
  ],

  // Dashboard CheckinChart (no agents selected) -> getCheckinsAgg() -> GET
  // /agents/checkins/aggregate, reads response.records, buildDataset maps
  // { x: checkin_time, y: count }. Timestamps derived from FROZEN_TIME.
  //
  // This 10-hour span only reads correctly under the "Hour" timeframe (24h
  // window, hourly buckets), which the dashboard test seeds explicitly — the
  // app's own default is "Second", a 60-second window. Move these timestamps
  // and that seed together, or the card captions a window it doesn't plot.
  checkinAggregate: {
    records: [
      { checkin_time: hoursAgo(10), count: 3 },
      { checkin_time: hoursAgo(8), count: 7 },
      { checkin_time: hoursAgo(6), count: 5 },
      { checkin_time: hoursAgo(4), count: 9 },
      { checkin_time: hoursAgo(2), count: 6 },
      { checkin_time: hoursAgo(1), count: 8 },
    ],
  },

  // Recent Tasks card = <agent-tasks-table :hide-columns="['id','task_name']">,
  // fed by GET /agents/tasks (paginated). Kept at <=10 rows (real data table).
  // `agent_id` is the config.idField (agentTaskConfig.js) the row's router-link
  // reads — a missing/renamed one throws "Missing required param id" — and it
  // renders in the non-hidden Agent column.
  //
  // `updated_at`, NOT created_at, is what the card actually shows: it is the
  // defaultHeader "Updated At" column and the table's default sort key. Omit it
  // and DateTimeDisplay renders fromNow(undefined) as "a few seconds ago" on
  // every row, behind an allowlisted [Vue warn] — a plausible-looking wrong
  // value rather than a blank one. Descending updated_at fixes the row order.
  recentTasks: [
    {
      id: 1,
      agent_id: "K3H8P2WQ",
      task_name: "powershell_situational_awareness_host_processes",
      input: "Get-Process",
      status: "completed",
      username: "ACME\\Administrator",
      created_at: minutesAgo(4),
      updated_at: minutesAgo(3),
    },
    {
      id: 2,
      agent_id: "M7QX4LZB",
      task_name: "shell whoami",
      input: "shell whoami",
      status: "completed",
      username: "ACME\\j.mercer",
      created_at: minutesAgo(11),
      updated_at: minutesAgo(10),
    },
    {
      id: 3,
      agent_id: "R9TF6NCV",
      task_name: "python_collection_linux_pillage",
      input: "pillage /home",
      status: "queued",
      username: "svc_deploy",
      // Still queued, so it has never been updated since creation.
      created_at: minutesAgo(18),
      updated_at: minutesAgo(18),
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

  // Matched by module_id against scenario.modules[].id. AutoRunModules renders
  // `${index + 1}. ${module.id || module.module_id}` and falls through to the
  // raw task when nothing matches, so an unmatched id renders the SAME string
  // as a real one — scenario.test.js is the only guard against it.
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

  // Both PluginTasksList call sites — the standalone /plugin-tasks route
  // (plugin: null) and PluginEdit's Tasks tab (plugin: plugins[0]) — drive
  // TasksTable.getTasks() with an ARRAY `selected`, so both hit the same
  // aggregate endpoint, GET /plugins/tasks, mocked by mockPluginTasks.
  // idField is `plugin_id` (pluginTaskConfig.js); it matches plugins[0].id
  // above so the Plugin column renders a real cross-referenced value rather
  // than an orphaned id.
  pluginTasks: [
    {
      id: 1,
      plugin_id: "basic_reporting",
      status: "completed",
      input: "generate_report",
      username: "admin",
      updated_at: hoursAgo(1),
      tags: [],
    },
    {
      id: 2,
      plugin_id: "basic_reporting",
      status: "started",
      input: "generate_report",
      username: "operator",
      updated_at: minutesAgo(20),
      tags: [],
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

  tags: [
    {
      id: 1,
      name: "engagement",
      color: "#6c5ce7",
      description: "Collected during the current engagement",
      usage_count: 4,
    },
    {
      id: 2,
      name: "domain-admin",
      color: "#d63031",
      description: "Grants Domain Admin on example.com",
      usage_count: 1,
    },
    {
      id: 3,
      name: "exfil",
      color: "#00b894",
      description: "Staged for exfiltration review",
      usage_count: 2,
    },
    {
      id: 4,
      name: "task:input",
      color: "#0984e3",
      description:
        "Attached automatically to module-generated tasking-input files (e.g. BOF/C# loader payloads)",
      usage_count: 1,
    },
    {
      id: 5,
      name: "reviewed",
      color: "#fdcb6e",
      description: "Triaged by the reporting lead",
      usage_count: 0,
    },
  ],

  // REVISED after the first capture measured the rendered table. The original
  // set had one record per credtype (netntlmv2, dcc2, krbtgs,
  // dpapi_masterkey), whose secrets run 50-85 characters. At the docs viewport
  // the sidebar and filter card leave ~1092px of content width, the Tags column
  // is a fixed 300px, and the resulting table needed ~1450px — Host, Tags and
  // Actions fell off-frame and Domain was severed mid-word.
  //
  // So this set keeps only the credtypes whose secret is short enough to
  // render: plaintext and hash. The full eleven-value vocabulary, with what
  // `password` holds for each, lives in the reference table in
  // docs/starkiller/credentials.md.
  //
  // The hash values are bare 32-char NT hashes, not `<lm>:<nt>`. credtypes.py
  // documents the paired form as "when a non-empty LM half is present", and
  // aad3b435b51404eeaad3b435b51404ee is precisely the EMPTY-LM sentinel — so
  // the bare form is the correct one here as well as the narrower one.
  //
  // Passwords render in the clear, so every value is synthetic: example.com
  // domains and patterned hex that is structurally valid but not derived from
  // any real secret.
  credentials: [
    {
      id: 1,
      credtype: "plaintext",
      domain: "example.com",
      username: "svc-backup",
      password: "Backup!Example123",
      host: "APP-01",
      tags: [{ id: 1, name: "engagement", color: "#6c5ce7" }],
    },
    {
      id: 2,
      credtype: "hash",
      domain: "example.com",
      username: "administrator",
      password: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
      host: "DC-01",
      tags: [
        { id: 1, name: "engagement", color: "#6c5ce7" },
        { id: 2, name: "domain-admin", color: "#d63031" },
      ],
    },
    {
      id: 3,
      credtype: "plaintext",
      domain: "example.com",
      username: "jdoe",
      password: "Summer2026!",
      host: "WKS-14",
      tags: [],
    },
    {
      id: 4,
      credtype: "hash",
      domain: "example.com",
      username: "mchen",
      password: "0a1b2c3d4e5f60718293a4b5c6d7e8f9",
      host: "WKS-22",
      tags: [],
    },
    {
      id: 5,
      credtype: "plaintext",
      domain: "example.com",
      username: "svc-sql",
      password: "Sql$vc-Example26",
      host: "APP-01",
      tags: [],
    },
  ],

  // Filenames read plausibly across the four DownloadSourceFilter values
  // (upload, stager, agent_file, agent_task). Sizes are chosen so
  // Downloads.vue's formatBytes renders varied units rather than six "1 KB"s.
  downloads: [
    {
      id: 1,
      filename: "seatbelt-output.txt",
      size: 18432,
      location: "/downloads/A1B2C3D4/seatbelt-output.txt",
      created_at: hoursAgo(3),
      updated_at: hoursAgo(3),
      tags: [
        { id: 1, name: "engagement", color: "#6c5ce7" },
        { id: 3, name: "exfil", color: "#00b894" },
      ],
    },
    {
      id: 2,
      filename: "launcher.ps1",
      size: 4096,
      location: "/downloads/uploads/empireadmin/launcher.ps1",
      created_at: hoursAgo(9),
      updated_at: hoursAgo(9),
      tags: [{ id: 4, name: "task:input", color: "#0984e3" }],
    },
    {
      id: 3,
      filename: "hosts-export.csv",
      size: 262144,
      location: "/downloads/A1B2C3D4/hosts-export.csv",
      created_at: hoursAgo(20),
      updated_at: hoursAgo(20),
      tags: [{ id: 3, name: "exfil", color: "#00b894" }],
    },
    {
      id: 4,
      filename: "chatlog.csv",
      size: 2048,
      location: "/downloads/uploads/empireadmin/chatlog.csv",
      created_at: daysAgo(1),
      updated_at: hoursAgo(6),
      tags: [{ id: 1, name: "engagement", color: "#6c5ce7" }],
    },
    {
      id: 5,
      filename: "sysinfo.json",
      size: 9216,
      location: "/downloads/E5F6A7B8/sysinfo.json",
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
      tags: [],
    },
    {
      id: 6,
      filename: "beacon-x64.bin",
      size: 1310720,
      location: "/downloads/uploads_system/beacon-x64.bin",
      created_at: daysAgo(3),
      updated_at: daysAgo(3),
      tags: [],
    },
  ],

  // Shape is { id, keyword, replacement } per Obfuscation.vue:230-245. The
  // first two echo config.yaml's database.defaults.keyword_obfuscation
  // (Invoke-Empire, Invoke-Mimikatz) so the image matches what a fresh
  // install actually seeds; replacements there are random per install, so
  // these are representative rather than reproducible. The third is an
  // operator-added pair.
  obfuscationKeywords: [
    { id: 1, keyword: "Invoke-Empire", replacement: "K7QW2" },
    { id: 2, keyword: "Invoke-Mimikatz", replacement: "R4XB9" },
    { id: 3, keyword: "Invoke-PowerDump", replacement: "T8MC3" },
  ],

  users: [
    { id: 1, username: "admin", is_admin: true, enabled: true },
    { id: 2, username: "operator", is_admin: false, enabled: true },
    { id: 3, username: "analyst", is_admin: false, enabled: false },
  ],

  // Bypasses.vue renders Name, Updated At and Actions columns
  // (Bypasses.vue:100-104). `name` renders as a router-link to bypassEdit;
  // updated_at goes through DateTimeDisplay, same relative-time/N/A rule as
  // malleableProfiles above. etw carries the real PowerShell ETW-patch
  // one-liner (BypassEdit.vue's code editor is the eventual Task 6 target),
  // the others are illustrative shorter stand-ins.
  bypasses: [
    {
      id: 1,
      name: "etw",
      language: "powershell",
      code: "[System.Diagnostics.Eventing.EventProvider].GetField('m_enabled','NonPublic,Instance').SetValue([Ref].Assembly.GetType('System.Management.Automation.Tracing.PSEtwLogProvider').GetField('etwProvider','NonPublic,Static').GetValue($null),0);",
      updated_at: hoursAgo(6),
    },
    {
      id: 2,
      name: "mattifestation",
      language: "powershell",
      code: "$a=[Ref].Assembly.GetTypes();...",
      updated_at: daysAgo(2),
    },
    {
      id: 3,
      name: "SafeChecksPython",
      language: "python",
      code: "import os\n# aborts the launcher on hosts running Little Snitch",
      updated_at: daysAgo(5),
    },
  ],

  // Exact shipped defaults from empire/server/config.yaml:34-49. All three
  // ship disabled; only powershell is preobfuscatable, which is why the
  // Preobfuscate and Remove buttons render disabled on the other two.
  obfuscationConfigs: [
    {
      language: "powershell",
      enabled: false,
      command: "Token\\All\\1",
      module: "invoke-obfuscation",
      preobfuscatable: true,
    },
    {
      language: "csharp",
      enabled: false,
      command: "",
      module: "confuser",
      preobfuscatable: false,
    },
    {
      language: "python",
      enabled: false,
      command: "",
      module: "python-obfuscator",
      preobfuscatable: false,
    },
  ],
};
