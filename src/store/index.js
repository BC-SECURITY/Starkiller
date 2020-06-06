import Vue from 'vue';
import Vuex from 'vuex';

import createPersistedState from 'vuex-persistedstate';
import { setInstance } from '@/api/axios-instance';
import { initNamespacedStore } from '@/store/electron-store';
import UserModule from './UserModule';
import ListenerModule from './ListenerModule';
import StagerModule from './StagerModule';
import AgentModule from './AgentModule';
import ModuleModule from './ModuleModule';
import CredentialModule from './CredentialModule';
import ApplicationModule from './ApplicationModule';


Vue.use(Vuex);

export default new Vuex.Store({
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    user: UserModule,
    listener: ListenerModule,
    stager: StagerModule,
    agent: AgentModule,
    module: ModuleModule,
    credential: CredentialModule,
    application: ApplicationModule,
  },
  plugins: [createPersistedState({
    paths: ['application'],
    rehydrated: ({ state }) => { // todo handle code duplication here?
      setInstance(state.application.url, state.application.token);
      initNamespacedStore(state.application.url);
    },
  })],
});
