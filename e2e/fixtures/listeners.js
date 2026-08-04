// e2e/fixtures/listeners.js
//
// Shaped to Empire 7.0's `Listener` DTO -- {id, name, enabled, template,
// options, created_at, host_address, tags}. Starkiller 4.x targets Empire 7.0
// only, so there is no older shape to carry: these previously also carried
// `module` and `listener_type`, which no Empire version has ever sent.
export const defaultListeners = [
  {
    id: 1,
    name: "http-1",
    enabled: true,
    template: "http",
    options: { Host: "http://0.0.0.0", Port: "80" },
    host_address: "http://0.0.0.0:80",
    tags: [],
    created_at: "2026-04-30T10:00:00Z",
  },
  {
    id: 2,
    name: "http-2-stopped",
    enabled: false,
    template: "http",
    options: { Host: "http://0.0.0.0", Port: "8080" },
    host_address: "http://0.0.0.0:8080",
    tags: [],
    created_at: "2026-04-30T11:00:00Z",
  },
];

export const httpTemplate = {
  id: "http",
  name: "http",
  description: "HTTP[S] listener",
  options: {
    Name: { value: "", required: true, description: "Name" },
    Host: { value: "http://0.0.0.0", required: true, description: "Host" },
    Port: { value: "80", required: true, description: "Port" },
  },
};

// A peer-to-peer (SMB) relay hosted on agent ABC12345, plus the template it
// instantiates. Deliberately kept OUT of defaultListeners so the many specs
// asserting on that list are unaffected -- graph specs opt in by concatenating.
//
// The graph renders a pivot as agent->agent and hides the relay listener
// itself; see isPivotListener in build-agent-graph.js for why that path was
// silently broken and went unexercised.
export const pivotListener = {
  id: 3,
  name: "smb-pivot-1",
  enabled: true,
  template: "smb",
  // `Agent` names the host agent -- this is what marks the listener a pivot.
  options: { Name: "smb-pivot-1", Agent: "ABC12345", PipeName: "empire_pipe" },
  host_address: "",
  tags: [],
  created_at: "2026-04-30T12:00:00Z",
};

// Trimmed to the fields the graph specs need. Two things must stay true to the
// wire: no `category` key (Empire 7.0 stopped sending one), and option values
// are nested objects here, unlike a listener's flat strings -- isPivotListener
// depends on telling those two shapes apart.
export const smbTemplate = {
  id: "smb",
  name: "smb_pivot",
  description: "Internal redirector listener using SMB.",
  options: {
    Name: { value: "smb", required: true, description: "Name" },
    Agent: { value: "", required: true, description: "Agent" },
    PipeName: { value: "empire_pipe", required: true, description: "Pipe" },
  },
};

// The agent reached *through* this relay lives in fixtures/agents.js as
// `pivotedAgent`, alongside the other agent fixtures.
