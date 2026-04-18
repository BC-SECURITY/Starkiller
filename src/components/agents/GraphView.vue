<!-- eslint-disable vue/html-self-closing -->
<template>
  <div>
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
    <list-page-top
      :breads="breads"
      :show-create="false"
      :show-refresh="true"
      :refresh-loading="nodeDataStatus === 'loading'"
      :show-delete="false"
      @refresh="getNodeData"
    >
      <template #extra-stuff>
        <TooltipButton
          v-if="focusedNode"
          :text="`Unfocus Node: ${focusedNode.name}`"
          icon="fa-eye-slash"
          @click="doUnfocusNode"
        />
        <TooltipButton
          text="Show All Nodes"
          icon="fa-expand"
          @click="showAllNodes"
        />
      </template>
    </list-page-top>
    <div>
      <div :style="graphStyle">
        <svg
          v-if="nodeDataStatus === 'success'"
          id="mySVG"
          width="100%"
          height="100%"
        ></svg>
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
// eslint-disable-next-line import/no-unresolved
import "@livereader/graphly-d3/style.css";
// eslint-disable-next-line import/no-unresolved
import { ForceSimulation, Event } from "@livereader/graphly-d3";
import { useAgentStore } from "@/stores/agent-module";
import { useListenerStore } from "@/stores/listener-module";
import ExecuteModuleDialog from "@/components/agents/ExecuteModuleDialog.vue";
import ExecuteShellDialog from "@/components/agents/ExecuteShellDialog.vue";
import ListPageTop from "@/components/ListPageTop.vue";
import TooltipButton from "@/components/TooltipButton.vue";
import Computer from "@/graph/computer";
import EmpireC2 from "@/graph/empirec2";

export default {
  name: "GraphView",
  components: {
    ListPageTop,
    TooltipButton,
    ExecuteModuleDialog,
    ExecuteShellDialog,
  },
  inject: ["snack", "confirm"],
  data() {
    return {
      breads: [
        {
          text: "Agents Graph",
          disabled: true,
          href: "/agents-graph",
        },
      ],
      simulation: null,
      selected: null,
      showMenu: false,
      menuPosition: {
        x: 0,
        y: 0,
      },
      nodeDataStatus: "",
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
      focusedNode: null,
      agents: [],
    };
  },
  computed: {
    agentStore() {
      return useAgentStore();
    },
    listenerStore() {
      return useListenerStore();
    },
    listeners() {
      return this.listenerStore.listeners;
    },
    listenerTemplatesList() {
      return this.listenerStore.templates;
    },
    listenerTemplates() {
      return this.listenerTemplatesList.reduce((acc, template) => {
        acc[template.id] = template;
        return acc;
      }, {});
    },
    pivots() {
      return this.listeners.filter(
        (x) =>
          this.listenerTemplates[x.template]?.category?.toLowerCase() ===
          "peer_to_peer",
      );
    },
    graph() {
      if (!this.agents || !this.listeners || !this.listenerTemplates) {
        return null;
      }
      const graph = this.defaultGraph();

      this.listeners
        .filter((listener) => {
          if (this.focusedNode && !this.focusedNode.session_id) {
            return listener.name === this.focusedNode.name;
          }
          const category =
            this.listenerTemplates[listener.template]?.category?.toLowerCase();
          return category !== "peer_to_peer";
        })
        .forEach((listener) => {
          const node = {
            id: `listener_${listener.name}`,
            shape: {
              type: "computer",
              scale: 0.7,
            },
            payload: {
              listener: true,
              title: listener.name,
              original: listener,
            },
          };
          graph.nodes.push(node);
          graph.links.push({
            source: `listener_${listener.name}`,
            target: "root",
            directed: true,
            strength: "strong",
            color: "#4cff33",
          });
        });

      this.agents
        .filter((agent) => !agent.archived)
        .filter((agent) => {
          if (this.focusedNode && !this.focusedNode.session_id) {
            return agent.listener === this.focusedNode.name;
          }
          return true;
        })
        .forEach((agent) => {
          const node = {
            id: `agent_${agent.session_id}`,
            shape: {
              type: "computer",
              scale: 0.7,
            },
            payload: {
              os: agent.os_details,
              title: agent.name,
              hacked: agent.high_integrity,
              original: agent,
            },
          };
          graph.nodes.push(node);

          const pivotMatch = this.pivots.find((p) => p.name === agent.listener);

          if (pivotMatch) {
            const pivotAgent = this.agents.find(
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
    },
    graphStyle() {
      return "height: calc(96vh - 104px - 36px); border: 2px solid grey; border-radius: 5px;";
    },
    menuItems() {
      return [
        {
          id: "open",
          name: "Open",
        },
        {
          id: "open-new-tab",
          name: "Open in new tab",
        },
        {
          id: "popout",
          name: "Popout",
          listenerOption: false,
        },
        {
          id: "execute-shell",
          name: "Execute shell",
          listenerOption: false,
        },
        {
          id: "execute-module",
          name: "Execute module",
          listenerOption: false,
        },
        {
          id: "kill",
          name: "Kill",
        },
        {
          id: "focus-node",
          name: "Focus",
          agentOption: false,
        },
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
  async mounted() {
    await this.getNodeData();
  },
  methods: {
    defaultGraph() {
      return {
        nodes: [
          {
            id: "root",
            shape: {
              type: "empirec2",
              scale: 1.0,
            },
            x: 0,
            y: 0,
            payload: {},
          },
        ],
        links: [],
      };
    },
    showAllNodes() {
      this.simulation.moveTo({
        nodes: this.graph.nodes,
      });
    },
    async createSimulation() {
      try {
        this.simulation = null;
        await this.$nextTick();
        const mySVG = document.getElementById("mySVG");
        if (!mySVG || !this.graph) return;

        const simulation = new ForceSimulation(mySVG);
        simulation.linkDistance = 15;
        simulation.draggableNodes = true;
        simulation.templateStore.add("computer", Computer);
        simulation.templateStore.add("empirec2", EmpireC2);

        simulation.on(Event.NodeContextMenu, (e, node) => {
          e.preventDefault();

          if (node.id === "root") {
            return;
          }

          this.showMenu = false;
          this.menuPosition.x = e.clientX;
          this.menuPosition.y = e.clientY;
          this.selected = node;

          this.$nextTick(() => {
            this.showMenu = true;
          });
        });

        await this.$nextTick();
        simulation.render(this.graph);
        this.simulation = simulation;

        setTimeout(() => {
          if (this.simulation) {
            this.showAllNodes();
          }
        }, 2000);
      } catch (err) {
        this.snack.error(`Failed to render graph: ${err.message || err}`);
      }
    },
    async getNodeData() {
      this.nodeDataStatus = "loading";
      try {
        await Promise.all([
          this.agentStore.getAgents(),
          this.listenerStore.getListeners(),
        ]);
        if (this.listenerTemplatesList?.length === 0) {
          await this.listenerStore.getListenerTemplates();
        }
        this.agents = this.agentStore.agents;
        this.nodeDataStatus = "success";
        await this.$nextTick();
        this.createSimulation();
      } catch (err) {
        this.nodeDataStatus = "error";
        this.snack.error(`Failed to load graph data: ${err.message || err}`);
      }
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
          { color: "red" },
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
    async doFocusNode(action, item) {
      this.focusedNode = item;
      await this.$nextTick();
      this.createSimulation();
    },
    async doUnfocusNode() {
      this.focusedNode = null;
      await this.$nextTick();
      this.createSimulation();
    },
  },
};
</script>

<style></style>
