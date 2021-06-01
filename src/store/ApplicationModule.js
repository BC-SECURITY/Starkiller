import { setInstance } from '@/api/axios-instance';
import axios from 'axios';
import { initNamespacedStore } from '@/store/electron-store';

// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcRenderer } from 'electron';

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
      initNamespacedStore(url);
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
        const token = await axios.post(`${url}/api/admin/login`,
          { username, password },
          { headers: { 'Content-Type': 'application/json' } });

        const user = await axios.get(`${url}/api/users/me?token=${token.data.token}`);
        const version = await axios.get(`${url}/api/version?token=${token.data.token}`);
        context.commit('setApplicationState', {
          token: token.data.token, url, socketUrl, user: user.data, version: version.data.version,
        });
      } catch (err) {
        let message = '';
        if (err.response && err.response.data) {
          message = err.response.data;
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
      axios.post(`${context.state.url}/api/admin/logout?token=${context.state.token}`);
      ipcRenderer.send('closeAllAgentWindows');
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
    agentHeaders(context, val) {
      context.commit('setAgentHeaders', val);
    },
  },
  getters: {
    isLoggedIn(state) {
      return state.token.length > 0;
    },
    isAdmin(state) {
      return state.user.admin === true;
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
