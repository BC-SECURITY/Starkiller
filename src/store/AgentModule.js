import * as agentApi from "@/api/agent-api";
import * as agentTaskApi from "@/api/agent-task-api";

export default {
  namespaced: true,
  state: {
    agents: [],
    status: "success",
    subscribed: {},
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
    setSubscribed(state, subscribed) {
      state.subscribed = subscribed;
    },
  },
  actions: {
    async getAgents(context) {
      context.commit("setStatus", "loading");
      const agents = await agentApi.getAgents(true);
      await context.commit("setAgents", agents);
      context.commit("setStatus", "success");

      const { autoSubscribeAgents } = context.rootState.application;
      if (autoSubscribeAgents) {
        agents.forEach((agent) => {
          if (!context.state.subscribed[agent.session_id]) {
            context.dispatch("subscribe", { sessionId: agent.session_id });
          }
        });
      }
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

      const { autoSubscribeAgents } = context.rootState.application;
      if (autoSubscribeAgents) {
        context.dispatch("subscribe", { sessionId: agent.session_id });
      }
    },
    clearQueue(context, { name, tasks }) {
      tasks.forEach((task) => {
        agentTaskApi.deleteTask(name, task);
      });
    },
    async subscribe(context, { sessionId }) {
      const { subscribed } = context.state;
      subscribed[sessionId] = true;
      context.commit("setSubscribed", { ...subscribed });
    },
    async unsubscribe(context, { sessionId }) {
      const { subscribed } = context.state;
      subscribed[sessionId] = false;
      context.commit("setSubscribed", { ...subscribed });
    },
    async clear(context) {
      context.commit("setAgents", []);
      context.commit("setSubscribed", {});
    },
  },
  getters: {
    subscribed: (state) => state.subscribed,
    agents: (state) => state.agents,
  },
};
