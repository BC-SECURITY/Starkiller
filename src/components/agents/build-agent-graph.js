// Pure topology-model construction for the agent graph. No Vue/D3/DOM here so
// it can be unit-tested in the node test environment.

/**
 * The agent hosting this listener, or null if it is not a peer-to-peer relay.
 *
 * A relay (smb, port_forward_pivot) runs *on* an agent and names it in its
 * `Agent` option; a team-server listener has no such option. This is the one
 * place that fact is read, so "is it a pivot" and "whose agent is it" can
 * never disagree -- they are the same lookup. When Empire grows a real
 * server-side parentage field, only this function changes.
 *
 * Takes a *listener*, whose `options` is a flat `{name: stringValue}` map, not
 * a *template*, whose option values are always-truthy objects. Hence the
 * explicit non-empty-string test.
 *
 * @param {object} listener a listener record (store shape, NOT a template)
 * @returns {string|null} the host agent's session_id, or null
 */
export function pivotHostAgentId(listener) {
  const hostAgent = listener?.options?.Agent;
  return typeof hostAgent === "string" && hostAgent.length > 0
    ? hostAgent
    : null;
}

/**
 * Is this listener a peer-to-peer relay rather than a team-server listener?
 *
 * Replaces a test of the listener template's `category === "peer_to_peer"`,
 * which Empire 7.0 removed -- silently emptying the pivot set. Note a pivot is
 * not guaranteed to be *linkable*: the named host may be absent or archived,
 * which leaves the agent behind it orphaned.
 *
 * @param {object} listener a listener record (store shape, NOT a template)
 * @returns {boolean}
 */
export function isPivotListener(listener) {
  return pivotHostAgentId(listener) !== null;
}

/**
 * Build the force-graph model (nodes + links) for the agent topology.
 *
 * @param {object}   args
 * @param {Array}    args.agents            agent records (store shape)
 * @param {Array}    args.listeners         listener records (store shape)
 * @param {Array}    args.listenerTemplates NOT read, and it does not gate
 *                                          anything either: the store seeds
 *                                          `templates: []` and `![]` is false,
 *                                          so the guard below never trips on
 *                                          it. Retained only so that removing
 *                                          it is a deliberate signature change
 *                                          rather than a drive-by.
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

  const pivots = listeners.filter(isPivotListener);

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
      return !isPivotListener(listener);
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
        // Match the node filter above: an archived host has no node, so linking
        // to it would emit an edge whose source id is absent from graph.nodes.
        // graphly-d3 drops such an edge at render time but graphSignature()
        // still counts it, so the repaint key would describe a link the canvas
        // never draws. Leave the agent unlinked instead, as when the host is
        // missing entirely.
        const hostId = pivotHostAgentId(pivotMatch);
        const pivotAgent = agents.find(
          (a) => !a.archived && a.session_id === hostId,
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
 * only when the topology actually changes, rather than on every store write.
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
