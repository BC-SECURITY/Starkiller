<!-- eslint-disable vue/html-self-closing -->
<template>
  <div
    class="agent-graph"
    :class="{ 'agent-graph--expanded': expanded }"
    :role="expanded ? 'dialog' : undefined"
    :aria-modal="expanded ? 'true' : undefined"
    :aria-label="expanded ? 'Agent topology graph (fullscreen)' : undefined"
  >
    <execute-module-dialog
      v-model="executeModule.showDialog"
      :agent="executeModule.sessionId"
      :module-name="executeModule.moduleName"
      :module-option-defaults="executeModule.moduleOptionDefaults"
    />
    <execute-shell-dialog
      v-model="executeShell.showDialog"
      :agent="executeShell.agent"
    />

    <div v-if="expandable" class="agent-graph__toolbar">
      <tooltip-button
        v-if="focusedNode"
        :text="`Unfocus Node: ${focusedNode.name}`"
        icon="fa-eye-slash"
        @click="unfocus"
      />
      <tooltip-button
        text="Show All Nodes"
        icon="fa-expand"
        @click="showAllNodes"
      />
      <tooltip-button
        :text="expanded ? 'Collapse' : 'Fullscreen'"
        :icon="
          expanded ? 'fa-compress' : 'fa-up-right-and-down-left-from-center'
        "
        @click="toggleExpand"
      />
    </div>

    <div class="agent-graph__canvas" :style="canvasStyle">
      <svg
        v-if="nodeDataStatus === 'success'"
        ref="svgEl"
        width="100%"
        height="100%"
        role="img"
        aria-label="Agent topology graph"
      ></svg>
      <div
        v-else-if="nodeDataStatus === 'loading'"
        class="agent-graph__status"
        role="status"
        aria-live="polite"
      >
        Loading graph…
      </div>
      <div v-else class="agent-graph__status" role="status" aria-live="polite">
        Failed to load graph data.
      </div>
    </div>

    <v-menu
      v-model="showMenu"
      :style="`position: fixed; left: ${menuPosition.x}px; top: ${menuPosition.y}px;`"
      close-on-content-click
    >
      <v-list>
        <v-list-item
          v-for="menuItem in menuItems"
          :key="menuItem.id"
          @click="clickAction(menuItem.id)"
        >
          <v-list-item-title>{{ menuItem.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import "@livereader/graphly-d3/style.css";
import { ForceSimulation, Event } from "@livereader/graphly-d3";
import { useAgentStore } from "@/stores/agent-module";
import { useListenerStore } from "@/stores/listener-module";
import ExecuteModuleDialog from "@/components/agents/ExecuteModuleDialog.vue";
import ExecuteShellDialog from "@/components/agents/ExecuteShellDialog.vue";
import TooltipButton from "@/components/TooltipButton.vue";
import Computer from "@/graph/computer";
import EmpireC2 from "@/graph/empirec2";
import {
  buildGraph,
  graphSignature,
} from "@/components/agents/build-agent-graph";

// Estimated context-menu size, used to clamp it inside the viewport so a
// right-click near the bottom edge of the bounded Dashboard card doesn't push
// the menu off-screen.
// Sized for the worst case (the 6-item agent menu: Open, Open in new tab,
// Popout, Execute shell, Execute module, Kill); update if menu items change.
const MENU_W = 220;
const MENU_H = 340;

export default {
  name: "AgentGraph",
  components: {
    TooltipButton,
    ExecuteModuleDialog,
    ExecuteShellDialog,
  },
  inject: ["snack", "confirm"],
  props: {
    // When true, render the in-component toolbar (Unfocus / Show All /
    // Fullscreen). The standalone page passes false and supplies its own header.
    expandable: {
      type: Boolean,
      default: false,
    },
    // CSS height of the (non-expanded) canvas. Defaults to the full-page height
    // the standalone page used; the Dashboard passes a bounded value.
    height: {
      type: String,
      default: "calc(96vh - 104px - 36px)",
    },
  },
  emits: ["loading-change", "focus-change"],
  data() {
    return {
      simulation: null,
      simulationSvg: null,
      autoFitTimer: null,
      refitTimer: null,
      selected: null,
      showMenu: false,
      menuPosition: { x: 0, y: 0 },
      nodeDataStatus: "loading",
      expanded: false,
      focusedNode: null,
      executeModule: {
        showDialog: false,
        sessionId: "",
        moduleName: "",
        moduleOptionDefaults: {},
      },
      executeShell: {
        showDialog: false,
        agent: {},
      },
    };
  },
  computed: {
    agentStore() {
      return useAgentStore();
    },
    listenerStore() {
      return useListenerStore();
    },
    listenerTemplatesList() {
      return this.listenerStore.templates;
    },
    canvasStyle() {
      const h = this.expanded ? "100%" : this.height;
      return `height: ${h}; border: 2px solid grey; border-radius: 5px;`;
    },
    graph() {
      return buildGraph({
        agents: this.agentStore.agents,
        listeners: this.listenerStore.listeners,
        listenerTemplates: this.listenerTemplatesList,
        focusedNode: this.focusedNode,
      });
    },
    // Watched: repaint only when the topology actually changes (incl. pivot
    // links flipping after templates load) — see build-agent-graph.js.
    signature() {
      return graphSignature(this.graph);
    },
    menuItems() {
      return [
        { id: "open", name: "Open" },
        { id: "open-new-tab", name: "Open in new tab" },
        { id: "popout", name: "Popout", listenerOption: false },
        { id: "execute-shell", name: "Execute shell", listenerOption: false },
        { id: "execute-module", name: "Execute module", listenerOption: false },
        { id: "kill", name: "Kill" },
        { id: "focus-node", name: "Focus", agentOption: false },
      ].filter((el) => {
        if (this.selected?.payload?.listener) {
          return el.listenerOption !== false;
        }
        if (this.selected?.payload?.os) {
          return el.agentOption !== false;
        }
        return false;
      });
    },
  },
  watch: {
    // Repaint when the topology id-set changes (host refresh, own refresh,
    // focus change, or templates arriving late).
    signature(newSig, oldSig) {
      if (newSig !== oldSig && this.nodeDataStatus === "success") {
        this.renderGraph();
      }
    },
    focusedNode(val) {
      this.$emit("focus-change", val);
    },
    expanded(val) {
      if (val) {
        document.addEventListener("keydown", this.onKeydown);
      } else {
        document.removeEventListener("keydown", this.onKeydown);
      }
      // Re-fit after the layout settles at the new size. Clear any pending
      // refit first so rapid expand/collapse doesn't stack timers.
      clearTimeout(this.refitTimer);
      this.$nextTick(() => {
        this.refitTimer = setTimeout(() => this.showAllNodes(), 50);
      });
    },
  },
  async mounted() {
    await this.ensureData();
  },
  beforeUnmount() {
    document.removeEventListener("keydown", this.onKeydown);
    clearTimeout(this.autoFitTimer);
    clearTimeout(this.refitTimer);
    this.teardownSimulation();
  },
  methods: {
    // --- Public API (called by host components via $refs):
    //     refresh(), focusNode(node), unfocus(), showAllNodes() ---

    // Mount-time load with a double-fetch guard: render from existing store
    // data when present and fetch only what is missing. Templates are ALWAYS
    // ensured because no host (incl. the Dashboard) fetches them and the
    // listener store is not persisted.
    async ensureData() {
      this.nodeDataStatus = "loading";
      this.$emit("loading-change", true);
      try {
        const tasks = [];
        const agentsEmpty = (this.agentStore.agents || []).length === 0;
        const listenersEmpty =
          (this.listenerStore.listeners || []).length === 0;
        if (agentsEmpty && this.agentStore.status !== "loading") {
          tasks.push(this.agentStore.getAgents());
        }
        if (listenersEmpty && this.listenerStore.status !== "loading") {
          tasks.push(this.listenerStore.getListeners());
        }
        if (this.listenerTemplatesList.length === 0) {
          tasks.push(this.listenerStore.getListenerTemplates());
        }
        await Promise.all(tasks);
        this.finishLoad("Failed to load graph data.");
      } catch (err) {
        this.nodeDataStatus = "error";
        this.snack.error(`Failed to load graph data: ${err.message || err}`);
      } finally {
        this.$emit("loading-change", false);
      }
    },
    // Force refresh (standalone page's refresh button). Always refetches.
    async refresh() {
      this.nodeDataStatus = "loading";
      this.$emit("loading-change", true);
      try {
        await Promise.all([
          this.agentStore.getAgents(),
          this.listenerStore.getListeners(),
        ]);
        // Templates are static-ish; only fetch when we have none. A force
        // refresh intentionally does not refetch already-loaded templates.
        if (this.listenerTemplatesList.length === 0) {
          await this.listenerStore.getListenerTemplates();
        }
        this.finishLoad("Failed to refresh graph data.");
      } catch (err) {
        this.nodeDataStatus = "error";
        this.snack.error(`Failed to refresh graph data: ${err.message || err}`);
      } finally {
        this.$emit("loading-change", false);
      }
    },
    // The agent/listener stores swallow their own errors (set status="error"
    // and resolve), so a thrown exception is NOT how we learn of a failed
    // fetch — derive it from store status, mirroring Dashboard.refreshAll().
    finishLoad(errorMessage) {
      if (
        this.agentStore.status === "error" ||
        this.listenerStore.status === "error"
      ) {
        this.nodeDataStatus = "error";
        this.snack.error(this.agentStore.lastError || errorMessage);
        return;
      }
      this.nodeDataStatus = "success";
      this.$nextTick(() => this.renderGraph());
    },
    async renderGraph() {
      try {
        if (this.nodeDataStatus !== "success") return;
        await this.$nextTick();
        const svg = this.$refs.svgEl;
        // The <svg> is behind v-if; the ref is null until success renders it.
        // ForceSimulation seeds its transform from clientWidth/Height, so skip
        // while the panel has no layout size (e.g. hidden/collapsed).
        // NOTE: a host that mounts this panel hidden (zero-size) must re-trigger
        // a render when it becomes visible (e.g. call refresh()). The Dashboard
        // card and standalone page are always visible at mount, so this is fine.
        if (!svg || !this.graph) return;
        if (svg.clientWidth === 0 || svg.clientHeight === 0) return;

        // Reuse the existing simulation for this svg: re-render in place
        // (forced=true clears old nodes/links) instead of constructing a new
        // ForceSimulation, which appends another world <g> and leaks the old
        // instance's MutationObserver + d3 tick loop (the library has no
        // dispose()). The reused simulation keeps the user's pan/zoom.
        if (this.simulation && this.simulationSvg === svg) {
          this.simulation.render(this.graph, 0.05, true);
          return;
        }

        // First render, or the svg was replaced (e.g. error -> success cycle):
        // tear down any stale simulation before creating a fresh one.
        this.teardownSimulation();

        const simulation = new ForceSimulation(svg);
        simulation.linkDistance = 15;
        simulation.draggableNodes = true;
        simulation.templateStore.add("computer", Computer);
        simulation.templateStore.add("empirec2", EmpireC2);

        simulation.on(Event.NodeContextMenu, (e, node) => {
          e.preventDefault();
          if (node.id === "root") return;

          this.showMenu = false;
          // Clamp to the viewport so the menu stays on-screen inside a bounded
          // card or after the page is scrolled. Clamp on both ends: off the
          // right/bottom edges, but never negative on a viewport smaller than
          // the menu.
          this.menuPosition.x = Math.max(
            0,
            Math.min(e.clientX, window.innerWidth - MENU_W),
          );
          this.menuPosition.y = Math.max(
            0,
            Math.min(e.clientY, window.innerHeight - MENU_H),
          );
          this.selected = node;
          this.$nextTick(() => {
            this.showMenu = true;
          });
        });

        // Claim the instance synchronously, before any await. renderGraph is
        // fired un-awaited from the signature watcher, so two calls can reach
        // here on the very first render (both find this.simulation still null).
        // Assigning before the awaits below closes that window: a re-entrant
        // call then coalesces into the reuse path above instead of constructing
        // a second ForceSimulation and leaking the loser's observer + tick loop.
        this.simulation = simulation;
        this.simulationSvg = svg;

        await this.$nextTick();
        simulation.render(this.graph);

        // Auto-fit only on the first render for this svg, so later in-place
        // repaints (host refreshes) don't yank a user's manual pan/zoom.
        clearTimeout(this.autoFitTimer);
        this.autoFitTimer = setTimeout(() => {
          if (this.simulation) this.showAllNodes();
        }, 2000);
      } catch (err) {
        this.snack.error(`Failed to render graph: ${err.message || err}`);
      }
    },
    // Best-effort teardown of the current simulation: stop its d3 tick loop and
    // disconnect its theme MutationObserver so we don't leak them when the svg
    // is replaced or the component unmounts.
    teardownSimulation() {
      if (!this.simulation) return;
      try {
        this.simulation.simulation?.stop?.();
        this.simulation.themeChangeObserver?.disconnect?.();
      } catch (_e) {
        // ignore — cleanup is best-effort
      }
      clearTimeout(this.autoFitTimer);
      this.simulation = null;
      this.simulationSvg = null;
    },
    showAllNodes() {
      // Fit against the simulation's OWN nodes, not the `graph` computed. The
      // computed rebuilds a fresh model (via buildGraph) whose nodes have no
      // live x/y — only the hardcoded root at (0,0) — so whenever a store
      // refresh invalidates it between render and this fit, moveTo() would
      // center on the origin (only the pinned root sits there) instead of the
      // drifted cluster.
      // The force layout mutates positions onto the objects it was handed,
      // which live on `this.simulation.graph.nodes`.
      const nodes = this.simulation?.graph?.nodes;
      if (this.simulation && nodes?.length) {
        this.simulation.moveTo({ nodes });
      }
    },
    toggleExpand() {
      this.expanded = !this.expanded;
    },
    onKeydown(e) {
      if (e.key !== "Escape") return;
      // Escape closes only the topmost surface: when the context menu or an
      // execute dialog is open, Vuetify closes it and the overlay stays
      // expanded (a second Escape then collapses it). Reliable ordering: this
      // listener registers at expand time, before any menu/dialog opens and
      // registers its own. Known edge: the Kill action's injected `confirm`
      // dialog isn't visible in local state, so Escape during that
      // confirmation still collapses the overlay — rare, accepted.
      if (
        this.showMenu ||
        this.executeModule.showDialog ||
        this.executeShell.showDialog
      ) {
        return;
      }
      this.expanded = false;
    },
    // Focus is owned here; the watcher on `signature` handles the repaint.
    focusNode(node) {
      this.focusedNode = node;
    },
    unfocus() {
      this.focusedNode = null;
    },
    async clickAction(action) {
      const item = this.selected.payload.original;
      const actions = {
        open: this.doOpen,
        "open-new-tab": this.doOpen,
        popout: this.doPopout,
        kill: this.doKill,
        "execute-shell": this.doExecuteShell,
        "execute-module": this.doExecuteModule,
        "focus-node": this.doFocusNode,
      };
      const handler = actions[action];
      if (handler) {
        await handler(action, item);
      }
    },
    doOpen(action, item) {
      let routerData = {};
      if (this.selected.payload.listener) {
        routerData = { name: "listenerEdit", params: { id: item.id } };
      } else {
        routerData = { name: "agentEdit", params: { id: item.session_id } };
      }
      if (action === "open-new-tab") {
        window.open(this.$router.resolve(routerData).href, "_blank");
      } else {
        this.$router.push(routerData);
      }
    },
    doPopout(action, item) {
      const route = this.$router.resolve({
        name: "agentEdit",
        params: { id: item.session_id },
      });
      window.open(
        `${route.href}?hideSideBar=true`,
        "popup",
        "width=600,height=600",
      );
    },
    async doKill(action, item) {
      if (this.selected.payload.listener) {
        if (
          await this.confirm(
            "Delete",
            `Are you sure you want to kill listener ${item.name}?`,
            { color: "red" },
          )
        ) {
          await this.listenerStore.killListener(item.id);
        }
      } else if (
        await this.confirm(
          "Kill Agent",
          `Do you want to kill agent ${item.name}?`,
          {
            color: "red",
          },
        )
      ) {
        await this.agentStore.killAgent({ sessionId: item.session_id });
        this.snack.success(`Agent ${item.name} tasked to run TASK_EXIT.`);
      }
    },
    doExecuteShell(action, item) {
      this.executeShell.showDialog = true;
      this.executeShell.agent = item;
    },
    doExecuteModule(action, item) {
      this.executeModule.showDialog = true;
      this.executeModule.sessionId = item.session_id;
    },
    doFocusNode(action, item) {
      this.focusNode(item);
    },
  },
};
</script>

<style scoped>
.agent-graph__toolbar {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  margin-bottom: 4px;
}
.agent-graph__status {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
/* Fullscreen overlay. z-index 1500 sits above the nav drawer (~1000) but below
   v-menu/v-dialog (2000+) and the snackbar (10000), so the context menu,
   execute dialogs, and error toasts still render above the expanded graph. */
.agent-graph--expanded {
  position: fixed;
  inset: 0;
  z-index: 1500;
  background: rgb(var(--v-theme-surface));
  padding: 8px;
  display: flex;
  flex-direction: column;
}
.agent-graph--expanded .agent-graph__canvas {
  flex: 1 1 auto;
}
</style>
