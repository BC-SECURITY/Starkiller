import * as bypassApi from '@/api/bypass-api';

export default {
  namespaced: true,
  state: {
    /**
     * Full array of bypass objects
     */
    bypasses: [],
  },
  mutations: {
    setBypasses(state, bypasses) {
      state.bypasses = bypasses;
    },
  },
  actions: {
    async getBypasses(context) {
      const bypasses = await bypassApi.getBypasses();
      context.commit('setBypasses', bypasses);
    },
    async deleteBypass(context, id) {
      await bypassApi.deleteBypass(id);
      const find = context.state.bypasses.findIndex((p) => p.id === id);
      if (find) {
        const bypasses = context.state.bypasses.slice();
        bypasses.splice(find, 1);
        context.commit('setBypasses', bypasses);
      }
    },
  },
  getters: {
    bypassNames: (state) => state.bypasses.map((el) => el.name),
  },
};
