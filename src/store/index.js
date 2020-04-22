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
import ProfileModule from './ProfileModule';


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
    profile: ProfileModule,
  },
  plugins: [createPersistedState({
    paths: ['profile'],
    rehydrated: ({ state }) => { // todo handle code duplication here?
      setInstance(state.profile.url, state.profile.token);
      initNamespacedStore(state.profile.url);
    },
  })],
});
