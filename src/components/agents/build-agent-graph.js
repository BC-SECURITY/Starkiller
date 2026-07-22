// Pure topology-model construction for the agent graph. No Vue/D3/DOM here so
// it can be unit-tested in the node test environment. Extracted verbatim from
// the logic that used to live in GraphView.vue's `graph` computed.

/**
 * Build the force-graph model (nodes + links) for the agent topology.
 *
 * @param {object}   args
 * @param {Array}    args.agents            agent records (store shape)
 * @param {Array}    args.listeners         listener records (store shape)
 * @param {Array}    args.listenerTemplates listener template records
 * @param {object}   [args.focusedNode]     a listener to focus on (has `.name`,
 *                                          no `.session_id`), or null
 * @returns {{nodes: Array, links: Array}|null} null if any collection is missing
 */
export function buildGraph({
  agents,
  listeners,
  listenerTemplates,
  focusedNode,
}) {
  if (!agents || !listeners || !listenerTemplates) {
    return null;
  }

  const templateMap = listenerTemplates.reduce((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  const pivots = listeners.filter(
    (x) => templateMap[x.template]?.category?.toLowerCase() === "peer_to_peer",
  );

  const graph = {
    nodes: [
      {
        id: "root",
        shape: { type: "empirec2", scale: 1.0 },
        x: 0,
        y: 0,
        payload: {},
      },
    ],
    links: [],
  };

  listeners
    .filter((listener) => {
      if (focusedNode && !focusedNode.session_id) {
        return listener.name === focusedNode.name;
      }
      const category = templateMap[listener.template]?.category?.toLowerCase();
      return category !== "peer_to_peer";
    })
    .forEach((listener) => {
      graph.nodes.push({
        id: `listener_${listener.name}`,
        shape: { type: "computer", scale: 0.7 },
        payload: { listener: true, title: listener.name, original: listener },
      });
      graph.links.push({
        source: `listener_${listener.name}`,
        target: "root",
        directed: true,
        strength: "strong",
        color: "#4cff33",
      });
    });

  agents
    .filter((agent) => !agent.archived)
    .filter((agent) => {
      if (focusedNode && !focusedNode.session_id) {
        return agent.listener === focusedNode.name;
      }
      return true;
    })
    .forEach((agent) => {
      graph.nodes.push({
        id: `agent_${agent.session_id}`,
        shape: { type: "computer", scale: 0.7 },
        payload: {
          os: agent.os_details,
          title: agent.name,
          hacked: agent.high_integrity,
          original: agent,
        },
      });

      const pivotMatch = pivots.find((p) => p.name === agent.listener);
      if (pivotMatch) {
        const pivotAgent = agents.find(
          (a) => a.session_id === pivotMatch.options.Agent,
        );
        if (pivotAgent) {
          graph.links.push({
            source: `agent_${pivotAgent.session_id}`,
            target: `agent_${agent.session_id}`,
            directed: true,
            strength: "strong",
          });
        }
      } else {
        graph.links.push({
          source: `listener_${agent.listener}`,
          target: `agent_${agent.session_id}`,
          directed: true,
          strength: "strong",
        });
      }
    });

  return graph;
}

/**
 * Stable signature of a graph's topology: sorted node ids plus sorted
 * source->target link pairs. The render watcher compares this so it repaints
 * only when the topology actually changes — including the case where pivot
 * links flip after listener templates load (node set unchanged, links change).
 *
 * @param {{nodes: Array, links: Array}|null} graph
 * @returns {string}
 */
export function graphSignature(graph) {
  if (!graph) return "";
  const nodes = graph.nodes
    .map((n) => n.id)
    .sort()
    .join(",");
  const links = graph.links
    .map((l) => `${l.source}->${l.target}`)
    .sort()
    .join(",");
  return `${nodes}|${links}`;
}
