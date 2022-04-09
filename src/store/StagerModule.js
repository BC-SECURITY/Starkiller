import * as stagerApi from '@/api/stager-api';

export default {
  namespaced: true,
  state: {
    stagers: [],
    templates: [],
  },
  mutations: {
    setStagers(state, stagers) {
      state.stagers = stagers;
    },
    pushStager(state, stager) {
      state.stagers.push(stager);
    },
    setTemplates(state, templates) {
      state.templates = templates;
    },
    removeStager(state, id) {
      const find = state.stagers.findIndex((s) => s.id === id);
      if (find > -1) {
        state.stagers.splice(find, 1);
      }
    },
  },
  actions: {
    async getStagers(context) {
      const stagers = await stagerApi.getStagers();
      context.commit('setStagers', stagers);
    },
    async getStagerTemplates(context) {
      const templates = await stagerApi.getStagerTemplates();
      context.commit('setTemplates', templates);
    },
    async deleteStager(context, id) {
      await stagerApi.deleteStager(id);
      context.commit('removeStager', id);
    },
    async addStager(context, stager) {
      const found = context.state.stagers.find((el) => el.ID === stager.id);

      if (!found) {
        context.commit('pushStager', stager);
      }
    },
  },
  getters: {
    templateIds: (state) => [...state.templates.map((el) => el.id)].sort(),
  },
};
