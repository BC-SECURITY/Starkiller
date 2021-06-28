import * as listenerApi from '@/api/listener-api';

export default {
  namespaced: true,
  state: {
    /**
     * Full array of listener objects
     */
    listeners: [],
    /**
     * String[] of listener types
     */
    types: [],
  },
  mutations: {
    setListeners(state, listeners) {
      state.listeners = listeners;
    },
    pushListener(state, listener) {
      state.listeners.push(listener);
    },
    setTypes(state, types) {
      state.types = types;
    },
    removeListener(state, name) {
      const find = state.listeners.findIndex((l) => l.name === name);
      if (find > -1) {
        state.listeners.splice(find, 1);
      }
    },
  },
  actions: {
    async getListeners(context) {
      const listeners = await listenerApi.getListeners();
      context.commit('setListeners', listeners);
    },
    async getListenerTypes(context) {
      const types = await listenerApi.getListenerTypes();
      context.commit('setTypes', types.sort());
    },
    async killListener(context, name) {
      await listenerApi.killListener(name);
      context.commit('removeListener', name);
    },
    async addListener(context, listener) {
      const found = context.state.listeners.find((el) => el.ID === listener.ID);

      if (!found) {
        context.commit('pushListener', listener);
      }
    },
  },
  getters: {
    listenerNames: (state) => state.listeners.map((el) => el.name),
  },
};
