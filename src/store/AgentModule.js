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
  },
  actions: {
    async getAgents(context) {
      const agents = await agentApi.getAgents();
      context.commit('setAgents', agents);
    },
    async rename(context, { oldName, newName }) {
      const { agents } = context.state;
      const agent = agents.find(el => el.name === oldName);

      if (agent != null) {
        agent.name = newName;
      }

      await agentApi.renameAgent(oldName, newName);
      context.commit('setAgents', agents);
    },
    async killAgent(context, { name }) {
      const { agents } = context.state;
      const agent = agents.find(el => el.name === name);

      if (agent == null) {
        return;
      }

      await agentApi.killAgent(name);
      context.commit('setAgents', agents);
    },
    async removeAgent(context, { name }) {
      const { agents } = context.state;
      const agent = agents.find(el => el.name === name);

      if (agent == null) {
        return;
      }

      await agentApi.removeAgent(name);
      context.commit('setAgents', agents);
    },
    clearQueue(context, { name }) {
      agentApi.clearQueue(name);
    },
  },
};
