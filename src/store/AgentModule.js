import * as agentApi from "@/api/agent-api";
import * as agentTaskApi from "@/api/agent-task-api";

export default {
  namespaced: true,
  state: {
    agents: [],
    status: "success",
  },
  mutations: {
    setAgents(state, agents) {
      state.agents = agents;
    },
    pushAgent(state, agent) {
      state.agents.push(agent);
    },
    setStatus(state, status) {
      state.status = status;
    },
  },
  actions: {
    async getAgents(context) {
      context.commit("setStatus", "loading");
      const agents = await agentApi.getAgents(true);
      await context.commit("setAgents", agents);
      context.commit("setStatus", "success");
    },
    async getAgent(context, { sessionId }) {
      const agent = (await agentApi.getAgent(sessionId))[0];
      context.dispatch("addAgent", agent);
    },
    async rename(context, { sessionId, newName }) {
      let { agents } = context.state;
      if (agents == null || agents.length === 0) {
        await context.dispatch("getAgents");
        ({ agents } = context.state);
      }
      const agent = agents.find((el) => el.session_id === sessionId);

      await agentApi.renameAgent(agent, newName);
      if (agent != null) {
        agent.name = newName;
      }

      context.commit("setAgents", agents);
      return agent.name;
    },
    async killAgent(context, { sessionId }) {
      const { agents } = context.state;
      const agent = agents.find((el) => el.session_id === sessionId);

      if (agent == null) {
        return;
      }

      await agentApi.killAgent(sessionId);
      agent.archived = true;
      context.commit("setAgents", agents);
    },
    async addAgent(context, agent) {
      const { agents } = context.state;
      const foundIndex = agents.findIndex(
        (el) => el.session_id === agent.session_id,
      );

      if (foundIndex >= 0) {
        agents.splice(foundIndex, 1, agent);
        context.commit("setAgents", agents);
      } else {
        context.commit("pushAgent", agent);
      }
    },
    clearQueue(context, { name, tasks }) {
      tasks.forEach((task) => {
        agentTaskApi.deleteTask(name, task);
      });
    },
  },
};
