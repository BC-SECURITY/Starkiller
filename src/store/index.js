import Vue from 'vue';
import Vuex from 'vuex';

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
});
