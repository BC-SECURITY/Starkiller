import * as stagerApi from '@/api/stager-api';
import { namespacedElectronStore } from '@/store/electron-store';
import { v4 as uuidv4 } from 'uuid';

export default {
  namespaced: true,
  state: {
    stagers: [],
    stagerTemplates: [],
  },
  mutations: {
    setStagerTemplates(state, stagerTemplates) {
      state.stagerTemplates = stagerTemplates;
    },
    setStagers(state, stagers) {
      state.stagers = stagers;
    },
    removeStager(state, id) {
      const find = state.stagers.findIndex((s) => s.id === id);
      if (find > -1) {
        state.stagers.splice(find, 1);
      }
    },
    clearState(state) {
      namespacedElectronStore.clear();
      state.stagers = [];
      state.stagerTemplates = [];
    },
  },
  actions: {
    async getStagerTemplates(context) {
      const stagers = await stagerApi.getStagers();
      context.commit('setStagerTemplates', stagers);
    },
    async getStagers(context) {
      const arr = namespacedElectronStore.get('generatedStagers', []);
      arr.forEach((stager) => {
        if (!stager.id) {
          // eslint-disable-next-line no-param-reassign
          stager.id = uuidv4();
        }
      });
      namespacedElectronStore.set('generatedStagers', arr);
      context.commit('setStagers', arr);
    },
    async deleteStager(context, id) {
      const arr = namespacedElectronStore.get('generatedStagers', []);
      const find = arr.findIndex((s) => s.id === id);
      if (find > -1) {
        arr.splice(find, 1);
      }
      namespacedElectronStore.set('generatedStagers', arr);
      context.commit('removeStager', id);
    },
    async addStager(context, stager) {
      const arr = namespacedElectronStore.get('generatedStagers', []);
      const name = Object.keys(stager)[0];
      const item = {
        ...stager[name], id: uuidv4(), name, createdAt: new Date().toISOString(),
      };
      arr.push(item);
      namespacedElectronStore.set('generatedStagers', arr);
      context.commit('setStagers', arr);
    },
    clear(context) {
      context.commit('clearState');
    },
  },
  getters: {
    stagerTypes: (state) => state.stagerTemplates.map((el) => el.Name).sort(),
  },
};
