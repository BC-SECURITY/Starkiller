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
    async generateStager(context, options) {
      const data = await stagerApi.generateStager(options);
      const arr = namespacedElectronStore.get('generatedStagers', []);

      if (typeof data === 'string') {
        // this one comes back with a 200 if it fails :/
        return;
      }

      const name = Object.keys(data)[0];
      const item = { ...data[name], name, createdAt: new Date().toISOString() };
      arr.push(item);
      namespacedElectronStore.set('generatedStagers', arr);
    },
  },
  getters: {
    stagerTypes: state => state.stagers.map(el => el.Name).sort(),
  },
};
