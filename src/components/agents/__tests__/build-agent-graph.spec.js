import {
  buildGraph,
  graphSignature,
} from "@/components/agents/build-agent-graph";

// Fixtures
const templates = [
  { id: "http_tpl", category: "client_server" },
  { id: "p2p_tpl", category: "peer_to_peer" },
];
const httpListener = { id: 1, name: "http", template: "http_tpl" };
const pivotListener = {
  id: 2,
  name: "smb_pivot",
  template: "p2p_tpl",
  options: { Agent: "AGENT_A" },
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

const ids = (graph) => graph.nodes.map((n) => n.id).sort();
const linkPairs = (graph) =>
  graph.links.map((l) => `${l.source}->${l.target}`).sort();

describe("buildGraph", () => {
  it("always includes a root node", () => {
    const g = buildGraph({
      agents: [],
      listeners: [],
      listenerTemplates: [],
      focusedNode: null,
    });
    expect(g.nodes.map((n) => n.id)).toContain("root");
  });

  it("returns null when any input collection is missing", () => {
    expect(
      buildGraph({
        agents: null,
        listeners: [],
        listenerTemplates: [],
        focusedNode: null,
      }),
    ).toBeNull();
  });

  it("creates a listener node linked to root", () => {
    const g = buildGraph({
      agents: [],
      listeners: [httpListener],
      listenerTemplates: templates,
      focusedNode: null,
    });
    expect(ids(g)).toContain("listener_http");
    expect(linkPairs(g)).toContain("listener_http->root");
  });

  it("links a non-pivot agent to its listener", () => {
    const g = buildGraph({
      agents: [agentA],
      listeners: [httpListener],
      listenerTemplates: templates,
      focusedNode: null,
    });
    expect(ids(g)).toContain("agent_AGENT_A");
    expect(linkPairs(g)).toContain("listener_http->agent_AGENT_A");
  });

  it("excludes archived agents", () => {
    const g = buildGraph({
      agents: [{ ...agentA, archived: true }],
      listeners: [httpListener],
      listenerTemplates: templates,
      focusedNode: null,
    });
    expect(ids(g)).not.toContain("agent_AGENT_A");
  });

  it("hides peer_to_peer listeners and links a pivoted agent to its host agent", () => {
    const g = buildGraph({
      agents: [agentA, agentB],
      listeners: [httpListener, pivotListener],
      listenerTemplates: templates,
      focusedNode: null,
    });
    expect(ids(g)).not.toContain("listener_smb_pivot");
    expect(linkPairs(g)).toContain("agent_AGENT_A->agent_AGENT_B");
  });

  it("adds an orphan agent node (no link) when a pivot's host agent is missing", () => {
    // pivotListener.options.Agent points at AGENT_A, but we omit AGENT_A here.
    const g = buildGraph({
      agents: [agentB], // only the pivoted agent; its host AGENT_A is absent
      listeners: [httpListener, pivotListener],
      listenerTemplates: templates,
      focusedNode: null,
    });
    // The agent node is still present...
    expect(ids(g)).toContain("agent_AGENT_B");
    // ...but it has no link (no host agent to attach to, pivot listener hidden).
    expect(linkPairs(g)).not.toContain("agent_AGENT_A->agent_AGENT_B");
    expect(linkPairs(g).some((p) => p.endsWith("->agent_AGENT_B"))).toBe(false);
  });

  it("filters to a focused listener and its agents", () => {
    const otherListener = { id: 3, name: "dns", template: "http_tpl" };
    const otherAgent = { ...agentA, session_id: "AGENT_C", listener: "dns" };
    const g = buildGraph({
      agents: [agentA, otherAgent],
      listeners: [httpListener, otherListener],
      listenerTemplates: templates,
      focusedNode: { name: "http" },
    });
    expect(ids(g)).toContain("listener_http");
    expect(ids(g)).not.toContain("listener_dns");
    expect(ids(g)).toContain("agent_AGENT_A");
    expect(ids(g)).not.toContain("agent_AGENT_C");
  });

  it("flips the pivot link when templates arrive late (signature changes)", () => {
    const before = buildGraph({
      agents: [agentA, agentB],
      listeners: [httpListener, pivotListener],
      listenerTemplates: [],
      focusedNode: null,
    });
    const after = buildGraph({
      agents: [agentA, agentB],
      listeners: [httpListener, pivotListener],
      listenerTemplates: templates,
      focusedNode: null,
    });
    expect(linkPairs(before)).toContain("listener_smb_pivot->agent_AGENT_B");
    expect(linkPairs(after)).toContain("agent_AGENT_A->agent_AGENT_B");
    expect(graphSignature(before)).not.toBe(graphSignature(after));
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
});
