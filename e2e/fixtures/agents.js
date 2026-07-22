// e2e/fixtures/agents.js
//
// `listener` and `os_details` are load-bearing for the graph specs
// (dashboard.spec.js, agents-graph.spec.js): build-agent-graph.js links each
// agent to `listener_${agent.listener}`, so `listener` must equal a name in
// fixtures/listeners.js (defaultListeners[0].name === "http-1"), and the
// graph's context menu only shows agent actions when `os_details` is truthy.
export const defaultAgents = [
  {
    session_id: "ABC12345",
    name: "ABC12345",
    hostname: "DESKTOP-1",
    username: "user1",
    high_integrity: false,
    process_name: "powershell.exe",
    language: "powershell",
    listener: "http-1",
    os_details: "Windows 10",
    archived: false,
    stale: false,
    checkin_time: "2026-04-30T10:00:00Z",
  },
  {
    session_id: "DEF67890",
    name: "renamed-agent",
    hostname: "DESKTOP-2",
    username: "user2",
    high_integrity: true,
    process_name: "python.exe",
    language: "python",
    listener: "http-1",
    os_details: "Linux",
    archived: false,
    stale: false,
    checkin_time: "2026-04-30T11:00:00Z",
  },
  {
    session_id: "GHI24680",
    name: "GHI24680",
    hostname: "DESKTOP-3",
    username: "user3",
    high_integrity: false,
    process_name: "powershell.exe",
    language: "powershell",
    listener: "http-1",
    os_details: "Windows 11",
    archived: false,
    stale: false,
    checkin_time: "2026-04-30T12:00:00Z",
  },
];
