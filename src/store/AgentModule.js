import * as agentApi from '@/api/agent-api';

export default {
  namespaced: true,
  state: {
    agents: [],
  },
  mutations: {
    setAgents(state, agents) {
      state.agents = agents;
    },
    pushAgent(state, agent) {
      state.agents.push(agent);
    },
  },
  actions: {
    async getAgents(context) {
      const agents = await agentApi.getAgents(true);
      context.commit('setAgents', agents);
    },
    async getAgent(context, { sessionId }) {
      const agent = (await agentApi.getAgent(sessionId))[0];
      context.dispatch('addAgent', agent);
    },
    async rename(context, { sessionId, newName }) {
      const { agents } = context.state;
      const agent = agents.find((el) => el.session_id === sessionId);

      await agentApi.renameAgent(sessionId, newName);
      if (agent != null) {
        agent.name = newName;
      }

      context.commit('setAgents', agents);
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
      context.commit('setAgents', agents);
    },
    async addAgent(context, agent) {
      const { agents } = context.state;
      const foundIndex = agents.findIndex((el) => el.session_id === agent.session_id);

      if (foundIndex >= 0) {
        agents.splice(foundIndex, 1, agent);
        context.commit('setAgents', agents);
      } else {
        context.commit('pushAgent', agent);
      }
    },
    clearQueue(context, { name, tasks }) {
      tasks.forEach((task) => {
        agentApi.deleteTask(name, task);
      });
    },
  },
};
