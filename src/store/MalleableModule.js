import * as malleableApi from '@/api/malleable-api';

export default {
  namespaced: true,
  state: {
    /**
     * Full array of malleable profile objects
     */
    malleableProfiles: [],
  },
  mutations: {
    setMalleableProfiles(state, malleableProfiles) {
      state.malleableProfiles = malleableProfiles;
    },
  },
  actions: {
    async getMalleableProfiles(context) {
      const profiles = await malleableApi.getMalleableProfiles();
      context.commit('setMalleableProfiles', profiles);
    },
  },
  getters: {
    profileNames: (state) => state.malleableProfiles.map((el) => el.name),
  },
};
