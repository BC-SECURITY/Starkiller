import * as obfuscationApi from '@/api/obfuscation-api';

export default {
  namespaced: true,
  state: {
    /**
     * Full array of keyword objects
     */
    keywords: [],
    configs: [],
  },
  mutations: {
    setKeywords(state, keywords) {
      state.keywords = keywords;
    },
    setConfigs(state, configs) {
      state.configs = configs;
    },
    removeKeyword(state, id) {
      const find = state.keywords.findIndex((k) => k.id === id);
      if (find > -1) {
        state.keywords.splice(find, 1);
      }
    },
  },
  actions: {
    async getKeywords(context) {
      const keywords = await obfuscationApi.getKeywords();
      context.commit('setKeywords', keywords);
    },
    async deleteKeyword(context, id) {
      await obfuscationApi.deleteKeyword(id);
      context.commit('removeKeyword', id);
    },
    async getConfigs(context) {
      const configs = await obfuscationApi.getObfuscationConfigs();
      context.commit('setConfigs', configs);
    },
  },
  getters: {
  },
};
