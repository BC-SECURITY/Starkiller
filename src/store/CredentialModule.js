import * as credentialApi from '@/api/credential-api';


export default {
  namespaced: true,
  state: {
    /**
     * Full array of credential objects
     */
    credentials: [],
  },
  mutations: {
    setCredentials(state, credentials) {
      state.credentials = credentials;
    },
  },
  actions: {
    async getCredentials(context) {
      const credentials = await credentialApi.getCredentials();
      context.commit('setCredentials', credentials);
    },
  },
  getters: {
  },
};
