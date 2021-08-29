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
    removeCredential(state, id) {
      const find = state.credentials.findIndex((c) => c.ID === id);
      if (find > -1) {
        state.credentials.splice(find, 1);
      }
    },
  },
  actions: {
    async getCredentials(context) {
      const credentials = await credentialApi.getCredentials();
      context.commit('setCredentials', credentials);
    },
    async deleteCredential(context, id) {
      await credentialApi.deleteCredential(id);
      context.commit('removeCredential', id);
    },
  },
  getters: {
    credentialIds: (state) => state.credentials.map((c) => c.ID),
    credentials: (state) => state.credentials,
  },
};
