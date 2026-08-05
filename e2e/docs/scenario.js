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
};
