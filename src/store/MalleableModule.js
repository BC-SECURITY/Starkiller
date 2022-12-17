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
    async deleteMalleableProfile(context, name) {
      await malleableApi.deleteMalleableProfile(name);
      const find = context.state.malleableProfiles.findIndex((p) => p.name === name);
      if (find) {
        const profiles = context.state.malleableProfiles.slice();
        profiles.splice(find, 1);
        context.commit('setMalleableProfiles', profiles);
      }
    },
  },
  getters: {
    profileNames: (state) => state.malleableProfiles.map((el) => el.name),
  },
};
