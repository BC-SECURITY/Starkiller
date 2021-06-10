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
  },
  getters: {
    bypassNames: (state) => state.bypasses.map((el) => el.name),
  },
};
