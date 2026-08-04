import {
  buildGraph,
  graphSignature,
  isPivotListener,
} from "@/components/agents/build-agent-graph";

// Fixtures: trimmed to the fields buildGraph actually reads -- NOT full copies
// of the API payloads (the real DTOs carry authors/comments/tactics/etc.).
//
// The one thing that must stay true to the wire: templates carry no `category`
// key, because Empire 7.0 stopped sending one. The old fixtures hand-wrote it,
// which is exactly why they kept passing after the field disappeared.
//
// `category` is left on the http template below to prove it is inert: nothing
// may resurrect template-metadata pivot detection.
const templates = [
  {
    id: "http",
    name: "HTTP[S]",
    category: "peer_to_peer",
    options: { Name: {}, Host: {}, Port: {} },
  },
  {
    id: "smb",
    name: "smb_pivot",
    // Nested option objects, as a template really sends them -- the shape
    // isPivotListener must not mistake for a listener's flat strings.
    options: {
      Name: {},
      Agent: { value: "", required: true, description: "Agent" },
      PipeName: {},
    },
  },
];
const httpListener = {
  id: 1,
  name: "http",
  template: "http",
  options: { Name: "http", Host: "http://0.0.0.0", Port: "80" },
};
const pivotListener = {
  id: 2,
  name: "smb_pivot",
  template: "smb",
  // The `Agent` option names the agent hosting this relay -- it is how a
  // peer-to-peer listener is identified, and how its host agent is found.
  options: { Name: "smb_pivot", Agent: "AGENT_A", PipeName: "empire_pipe" },
};
const agentA = {
  session_id: "AGENT_A",
  name: "A",
  listener: "http",
  archived: false,
  os_details: "Windows",
  high_integrity: 0,
};
const agentB = {
  session_id: "AGENT_B",
  name: "B",
  listener: "smb_pivot",
  archived: false,
  os_details: "Linux",
  high_integrity: 0,
};

// Defaults are the inert values (empty collections, no focus, the unread
// template set) so each test states only its distinguishing input.
const build = (overrides = {}) =>
  buildGraph({
    agents: [],
    listeners: [],
    listenerTemplates: templates,
    focusedNode: null,
    ...overrides,
  });

const ids = (graph) => graph.nodes.map((n) => n.id).sort();
const linkPairs = (graph) =>
  graph.links.map((l) => `${l.source}->${l.target}`).sort();
const inboundLinks = (graph, id) =>
  linkPairs(graph).filter((p) => p.endsWith(`->${id}`));

describe("buildGraph", () => {
  it("always includes a root node", () => {
    expect(build().nodes.map((n) => n.id)).toContain("root");
  });

  // Parametrized over all three keys, not just `agents`: the guard is the sole
  // stated reason buildGraph still takes `listenerTemplates`, so a pass that
  // deletes the param should fail here rather than slip through silently.
  it.each(["agents", "listeners", "listenerTemplates"])(
    "returns null when %s is missing",
    (missing) => {
      expect(build({ [missing]: null })).toBeNull();
    },
  );

  it("creates a listener node linked to root", () => {
    const g = build({ listeners: [httpListener] });
    expect(ids(g)).toContain("listener_http");
    expect(linkPairs(g)).toContain("listener_http->root");
  });

  it("links a non-pivot agent to its listener", () => {
    const g = build({ agents: [agentA], listeners: [httpListener] });
    expect(ids(g)).toContain("agent_AGENT_A");
    expect(linkPairs(g)).toContain("listener_http->agent_AGENT_A");
  });

  it("excludes archived agents", () => {
    const g = build({
      agents: [{ ...agentA, archived: true }],
      listeners: [httpListener],
    });
    expect(ids(g)).not.toContain("agent_AGENT_A");
  });

  it("hides pivot listeners and links a pivoted agent to its host agent", () => {
    const g = build({
      agents: [agentA, agentB],
      listeners: [httpListener, pivotListener],
    });
    expect(ids(g)).not.toContain("listener_smb_pivot");
    expect(linkPairs(g)).toContain("agent_AGENT_A->agent_AGENT_B");
  });

  it("leaves a pivoted agent unlinked when its host agent is archived", () => {
    // The host has no node (archived agents are filtered out), so linking to it
    // would emit an edge graphly-d3 drops at render but graphSignature counts.
    const g = build({
      agents: [{ ...agentA, archived: true }, agentB],
      listeners: [httpListener, pivotListener],
    });
    expect(ids(g)).not.toContain("agent_AGENT_A");
    expect(inboundLinks(g, "agent_AGENT_B")).toEqual([]);
  });

  it("adds an orphan agent node (no link) when a pivot's host agent is missing", () => {
    // pivotListener names AGENT_A as its host, but we omit AGENT_A here.
    const g = build({
      agents: [agentB], // only the pivoted agent; its host is absent
      listeners: [httpListener, pivotListener],
    });
    expect(ids(g)).toContain("agent_AGENT_B");
    expect(inboundLinks(g, "agent_AGENT_B")).toEqual([]);
  });

  it("filters to a focused listener and its agents", () => {
    const otherListener = { id: 3, name: "dns", template: "http" };
    const otherAgent = { ...agentA, session_id: "AGENT_C", listener: "dns" };
    const g = build({
      agents: [agentA, otherAgent],
      listeners: [httpListener, otherListener],
      focusedNode: { name: "http" },
    });
    expect(ids(g)).toContain("listener_http");
    expect(ids(g)).not.toContain("listener_dns");
    expect(ids(g)).toContain("agent_AGENT_A");
    expect(ids(g)).not.toContain("agent_AGENT_C");
  });

  // Detection never consults templates, so the topology must already be right
  // with none loaded -- not merely repaint into shape once they arrive.
  it("draws the pivot chain before listener templates have loaded", () => {
    const topology = { agents: [agentA, agentB], listeners: [httpListener, pivotListener] }; // prettier-ignore
    const before = build({ ...topology, listenerTemplates: [] });
    const after = build({ ...topology, listenerTemplates: templates });
    expect(linkPairs(before)).toContain("agent_AGENT_A->agent_AGENT_B");
    expect(ids(before)).not.toContain("listener_smb_pivot");
    expect(graphSignature(before)).toBe(graphSignature(after));
  });
});

describe("isPivotListener", () => {
  it("identifies a listener that names a host agent", () => {
    expect(isPivotListener(pivotListener)).toBe(true);
  });

  it("rejects a team-server listener with no Agent option", () => {
    expect(isPivotListener(httpListener)).toBe(false);
  });

  it("identifies port_forward_pivot, Empire's other peer-to-peer listener", () => {
    // Not a redundant case: pins detection to the `Agent` option rather than to
    // the template id, which an `x.template === "smb"` shortcut would satisfy
    // while quietly dropping every port-forward pivot from the topology.
    expect(
      isPivotListener({
        id: 4,
        name: "pf-1",
        template: "port_forward_pivot",
        options: { Name: "pf-1", Agent: "AGENT_A", ListenPort: "8080" },
      }),
    ).toBe(true);
  });

  it("rejects a listener whose Agent option is present but empty", () => {
    // The server sends "" for an unset option rather than omitting the key.
    expect(isPivotListener({ ...pivotListener, options: { Agent: "" } })).toBe(
      false,
    );
  });

  it("tolerates a listener with no options at all", () => {
    expect(isPivotListener({ id: 9, name: "bare" })).toBe(false);
  });

  it("ignores listener-template `category` metadata entirely", () => {
    // The retired mechanism must stay dead: `templates[0]` (http) carries
    // category "peer_to_peer", and its listener must still not be a pivot.
    expect(templates[0].category).toBe("peer_to_peer");
    expect(isPivotListener(httpListener)).toBe(false);
    expect(ids(build({ listeners: [httpListener] }))).toContain(
      "listener_http",
    );
  });

  it("rejects a listener *template*, whose option values are objects", () => {
    // A template's option values are objects, and every object is truthy, so a
    // bare truthiness test would call the smb/port_forward templates pivots.
    expect(isPivotListener(templates[1])).toBe(false);
  });
});

describe("graphSignature", () => {
  it("is stable regardless of node/link ordering", () => {
    // Two distinct links in opposite order (plus permuted nodes) so the
    // assertion actually exercises link-order independence — it fails if the
    // links.sort() in graphSignature is dropped, not just the node sort.
    const g1 = {
      nodes: [{ id: "a" }, { id: "b" }, { id: "c" }],
      links: [
        { source: "a", target: "b" },
        { source: "b", target: "c" },
      ],
    };
    const g2 = {
      nodes: [{ id: "c" }, { id: "b" }, { id: "a" }],
      links: [
        { source: "b", target: "c" },
        { source: "a", target: "b" },
      ],
    };
    expect(graphSignature(g1)).toBe(graphSignature(g2));
  });

  it("returns an empty string for a null graph", () => {
    expect(graphSignature(null)).toBe("");
  });

  // The assertions above are all "these two are EQUAL", so they would still
  // pass if graphSignature returned a constant — and AgentGraph.vue's
  // `signature` watcher would then silently never repaint. Pin the other
  // direction too. The link case holds the node set identical so it is the
  // link change alone being detected, which is the case the watcher exists for.
  it("changes when links differ but the node set does not", () => {
    const nodes = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const g1 = { nodes, links: [{ source: "a", target: "b" }] };
    const g2 = { nodes, links: [{ source: "a", target: "c" }] };
    expect(graphSignature(g1)).not.toBe(graphSignature(g2));
  });

  it("changes when the node set differs", () => {
    const g1 = { nodes: [{ id: "a" }], links: [] };
    const g2 = { nodes: [{ id: "a" }, { id: "b" }], links: [] };
    expect(graphSignature(g1)).not.toBe(graphSignature(g2));
  });
});
