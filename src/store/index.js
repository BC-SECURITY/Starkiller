import Vue from 'vue';
import Vuex from 'vuex';

import createPersistedState from 'vuex-persistedstate';
import { setInstance } from '@/api/axios-instance';
import UserModule from './UserModule';
import ListenerModule from './ListenerModule';
import StagerModule from './StagerModule';
import AgentModule from './AgentModule';
import ModuleModule from './ModuleModule';
import ObfuscationModule from './ObfuscationModule';
import CredentialModule from './CredentialModule';
import PluginModule from './PluginModule';
import ApplicationModule from './ApplicationModule';
import BypassModule from './BypassModule';
import MalleableModule from './MalleableModule';

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
    obfuscation: ObfuscationModule,
    credential: CredentialModule,
    bypass: BypassModule,
    malleable: MalleableModule,
    plugin: PluginModule,
    application: ApplicationModule,
  },
  plugins: [createPersistedState({
    paths: ['application'],
    rehydrated: ({ state }) => {
      setInstance(state.application.url, state.application.token);
    },
  })],
});
