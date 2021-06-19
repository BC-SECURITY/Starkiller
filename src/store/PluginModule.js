import * as pluginApi from '@/api/plugin-api';

export default {
  namespaced: true,
  state: {
    /**
     * Full array of credential objects
     */
    plugins: [],
  },
  mutations: {
    setPlugins(state, plugins) {
      state.plugins = plugins;
    },
  },
  actions: {
    async getPlugins(context) {
      const plugins = await pluginApi.getPlugins();
      context.commit('setPlugins', plugins);
    },
  },
  getters: {
  },
};
