import * as moduleApi from '@/api/module-api';

export default {
  namespaced: true,
  state: {
    modules: [],
  },
  mutations: {
    setModules(state, modules) {
      state.modules = modules;
    },
  },
  actions: {
    async getModules(context) {
      const modules = await moduleApi.getModules();
      context.commit('setModules', modules);
    },
    executeModule(context, { name, options }) {
      moduleApi.executeModule(name, options);
    },
  },
  getters: {
    searchModuleNames: state => name => state.modules.filter(el => el.Name.includes(name)),
  },
};
