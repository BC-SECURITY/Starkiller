import { setInstance } from '@/api/axios-instance';
import axios from 'axios';

export default {
  namespaced: true,
  state: {
    token: '',
    url: '',
    user: {},
    loginError: '',
    empireVersion: '',
    darkMode: true,
    chatWidget: true,
    hideStaleAgents: false,
    hideArchivedAgents: true,
    filterOnlyMyStagers: true,
    agentHeaders: [],
    connectionError: 0,
  },
  mutations: {
    setApplicationState(state, {
      token, url, socketUrl, user, version,
    }) {
      state.token = token;
      state.url = url;
      state.socketUrl = socketUrl;
      state.user = user;
      state.empireVersion = version;
      setInstance(url, token);
    },
    setLoginError(state, error) {
      state.loginError = error;
    },
    setConnectionError(state) {
      state.connectionError += 1;
    },
    setLogout(state) {
      state.token = '';
      state.url = '';
      state.socketUrl = '';
      state.user = {};
      state.empireVersion = '';
    },
    clearState(state) {
      state.token = '';
      state.url = '';
      state.user = {};
      state.loginError = '';
      state.empireVersion = '';
      state.darkMode = true;
      state.chatWidget = true;
      state.hideStaleAgents = false;
      state.hideArchivedAgents = true;
      state.filterOnlyMyStagers = true;
      state.agentHeaders = [];
    },
    setDarkMode(state, val) {
      state.darkMode = val;
    },
    setChatWidget(state, val) {
      state.chatWidget = val;
    },
    setHideStaleAgents(state, val) {
      state.hideStaleAgents = val;
    },
    setHideArchivedAgents(state, val) {
      state.hideArchivedAgents = val;
    },
    setFilterOnlyMyStagers(state, val) {
      state.filterOnlyMyStagers = val;
    },
    setAgentHeaders(state, val) {
      state.agentHeaders = val;
    },
  },
  actions: {
    async login(context, {
      url, socketUrl, username, password,
    }) {
      try {
        context.commit('setLoginError', '');
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        const token = await axios.post(`${url}/token`, formData);

        const user = await axios.get(`${url}/api/v2/users/me`, { headers: { Authorization: `Bearer ${token.data.access_token}` } });
        const version = await axios.get(`${url}/api/v2/meta/version`, { headers: { Authorization: `Bearer ${token.data.access_token}` } });
        context.commit('setApplicationState', {
          token: token.data.access_token,
          url,
          socketUrl,
          user: user.data,
          version: version.data.version,
        });
      } catch (err) {
        let message = '';
        if (err.response && err.response.data) {
          message = err.response.data.detail;
        } else if (err.response && err.response.statusText) {
          message = err.response.statusText;
        } else {
          message = 'Unable to connect to server.';
        }
        context.commit('setLoginError', message);
      }
    },
    connectionError(context) {
      context.commit('setConnectionError');
    },
    async logout(context) {
      context.commit('setLogout');
    },
    clear(context) {
      context.commit('clearState');
    },
    darkMode(context, val) {
      context.commit('setDarkMode', val);
    },
    chatWidget(context, val) {
      context.commit('setChatWidget', val);
    },
    hideStaleAgents(context, val) {
      context.commit('setHideStaleAgents', val);
    },
    hideArchivedAgents(context, val) {
      context.commit('setHideArchivedAgents', val);
    },
    filterOnlyMyStagers(context, val) {
      context.commit('setFilterOnlyMyStagers', val);
    },
    agentHeaders(context, val) {
      context.commit('setAgentHeaders', val);
    },
  },
  getters: {
    isLoggedIn(state) {
      return state.token.length > 0;
    },
    isAdmin(state) {
      return state.user.is_admin === true;
    },
    isDarkMode(state) {
      return state.darkMode;
    },
    isChatWidget(state) {
      return state.chatWidget;
    },
    token(state) {
      return state.token;
    },
    socketUrl(state) {
      return state.socketUrl;
    },
  },
};
