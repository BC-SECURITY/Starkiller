import * as listenerApi from '@/api/listener-api';

export default {
  namespaced: true,
  state: {
    /**
     * Full array of listener objects
     */
    listeners: [],
    /**
     * The status of the listeners request. This can be used to determine if the
     * request is still in progress.
     */
    status: 'success',
    /**
     * Full array of listener template objects
     */
    templates: [],
  },
  mutations: {
    setListeners(state, listeners) {
      state.listeners = listeners;
    },
    setStatus(state, status) {
      state.status = status;
    },
    pushListener(state, listener) {
      state.listeners.push(listener);
    },
    setTemplates(state, templates) {
      state.templates = templates;
    },
    removeListener(state, id) {
      const find = state.listeners.findIndex((l) => l.id === id);
      if (find > -1) {
        state.listeners.splice(find, 1);
      }
    },
  },
  actions: {
    async getListeners(context) {
      context.commit('setStatus', 'loading');
      const listeners = await listenerApi.getListeners();
      context.commit('setListeners', listeners);
      context.commit('setStatus', 'success');
    },
    async getListenerTemplates(context) {
      const templates = await listenerApi.getListenerTemplates();
      context.commit('setTemplates', templates);
    },
    async killListener(context, id) {
      await listenerApi.killListener(id);
      context.commit('removeListener', id);
    },
    async addListener(context, listener) {
      const found = context.state.listeners.find((el) => el.id === listener.id);

      if (!found) {
        context.commit('pushListener', listener);
      }
    },
  },
  getters: {
    listenerNames: (state) => state.listeners.map((el) => el.name),
    templateIds: (state) => [...state.templates.map((el) => el.id)].sort(),
  },
};
