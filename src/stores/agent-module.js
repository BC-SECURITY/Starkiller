import { defineStore } from "pinia";
import * as agentApi from "@/api/agent-api";
import * as agentTaskApi from "@/api/agent-task-api";
import { useApplicationStore } from "@/stores/application-module";

// eslint-disable-next-line import/prefer-default-export
export const useAgentStore = defineStore("agent", {
  persist: true,
  state: () => ({
    agents: [],
    status: "success",
    subscribed: {},
  }),
  actions: {
    async getAgents() {
      this.status = "loading";
      const agents = await agentApi.getAgents(true);
      this.agents = agents;
      this.status = "success";

      const { autoSubscribeAgents } = useApplicationStore();
      if (autoSubscribeAgents) {
        agents.forEach((agent) => {
          if (!this.subscribed[agent.session_id]) {
            this.subscribe({ sessionId: agent.session_id });
          }
        });
      }
    },
    async getAgent({ sessionId }) {
      const agent = (await agentApi.getAgent(sessionId))[0];
      this.addAgent(agent);
    },
    async rename({ sessionId, newName }) {
      const agentIndex = this.agents.findIndex(
        (el) => el.session_id === sessionId,
      );
      if (agentIndex < 0) {
        await this.getAgents();
      }

      const agent = this.agents[agentIndex];
      await agentApi.renameAgent(agent, newName);
      if (agent) {
        agent.name = newName;
        this.agents.splice(agentIndex, 1, agent);
      }

      return agent ? agent.name : null;
    },
    async killAgent({ sessionId }) {
      const agentIndex = this.agents.findIndex(
        (el) => el.session_id === sessionId,
      );
      if (agentIndex < 0) return;

      const agent = this.agents[agentIndex];
      await agentApi.killAgent(sessionId);
      if (agent) {
        agent.archived = true;
        this.agents.splice(agentIndex, 1, agent);
      }
    },
    async addAgent(agent) {
      const foundIndex = this.agents.findIndex(
        (el) => el.session_id === agent.session_id,
      );

      if (foundIndex >= 0) {
        this.agents.splice(foundIndex, 1, agent);
      } else {
        this.agents.push(agent);
      }

      const { autoSubscribeAgents } = useApplicationStore();
      if (autoSubscribeAgents) {
        this.subscribe({ sessionId: agent.session_id });
      }
    },
    clearQueue({ sessionId, tasks }) {
      tasks.forEach((task) => {
        agentTaskApi.deleteTask(sessionId, task);
      });
    },
    async subscribe({ sessionId }) {
      this.subscribed[sessionId] = true;
      this.subscribed = { ...this.subscribed };
    },
    async unsubscribe({ sessionId }) {
      this.subscribed[sessionId] = false;
      this.subscribed = { ...this.subscribed };
    },
    async clear() {
      this.agents = [];
      this.subscribed = {};
    },
  },
  getters: {},
});
