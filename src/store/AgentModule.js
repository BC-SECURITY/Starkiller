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
      const agents = await agentApi.getAgents();
      context.commit('setAgents', agents);
    },
    async getAgent(context, { sessionId }) {
      const agent = (await agentApi.getAgent(sessionId))[0];
      context.dispatch('addAgent', agent);
    },
    async rename(context, { oldName, newName }) {
      const { agents } = context.state;
      const agent = agents.find((el) => el.name === oldName);

      await agentApi.renameAgent(oldName, newName);
      if (agent != null) {
        agent.name = newName;
      }

      context.commit('setAgents', agents);
      return agent.name;
    },
    async killAgent(context, { name }) {
      const { agents } = context.state;
      const agent = agents.find((el) => el.name === name);

      if (agent == null) {
        return;
      }

      await agentApi.killAgent(name);
      context.commit('setAgents', agents);
    },
    async removeAgent(context, { name }) {
      const { agents } = context.state;
      const agent = agents.find((el) => el.name === name);

      if (agent == null) {
        return;
      }

      await agentApi.removeAgent(name);
      context.commit('setAgents', agents);
    },
    async addAgent(context, agent) {
      const { agents } = context.state;
      const foundIndex = agents.findIndex((el) => el.id === agent.id); // todo ID?

      if (foundIndex >= 0) {
        agents.splice(foundIndex, 1, agent);
        context.commit('setAgents', agents);
      } else {
        context.commit('pushAgent', agent);
      }
    },
    clearQueue(context, { name }) {
      agentApi.clearQueue(name);
    },
  },
};
