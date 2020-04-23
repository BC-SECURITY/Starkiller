import * as stagerApi from '@/api/stager-api';
import { namespacedElectronStore } from '@/store/electron-store';

export default {
  namespaced: true,
  state: {
    stagers: [],
  },
  mutations: {
    setStagers(state, stagers) {
      state.stagers = stagers;
    },
  },
  actions: {
    async getStagers(context) {
      const stagers = await stagerApi.getStagers();
      context.commit('setStagers', stagers);
    },
    async addStager(context, stager) {
      const arr = namespacedElectronStore.get('generatedStagers', []);
      const name = Object.keys(stager)[0];
      const item = { ...stager[name], name, createdAt: new Date().toISOString() };
      arr.push(item);
      namespacedElectronStore.set('generatedStagers', arr);
    },
  },
  getters: {
    stagerTypes: state => state.stagers.map(el => el.Name).sort(),
  },
};
