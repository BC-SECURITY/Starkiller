import { setInstance } from "@/api/axios-instance";
import axios from "axios";

export default {
  namespaced: true,
  state: {
    token: "",
    url: "",
    user: {},
    loginError: "",
    empireVersion: "",
    darkMode: true,
    chatWidget: true,
    hideStaleAgents: false,
    hideArchivedAgents: true,
    filterOnlyMyStagers: true,
    autoSubscribeAgents: true,
    agentHeaders: [],
    connectionError: 0,
    notifications: [],
  },
  mutations: {
    setApplicationState(
      state,
      { token, url, socketUrl, user, version, notifications },
    ) {
      state.token = token;
      state.url = url;
      state.socketUrl = socketUrl;
      state.user = user;
      state.empireVersion = version;
      state.notifications = notifications;
      setInstance(url, token);
    },
    setLoginError(state, error) {
      state.loginError = error;
    },
    setConnectionError(state) {
      state.connectionError += 1;
    },
    setLogout(state) {
      state.token = "";
      state.url = "";
      state.socketUrl = "";
      state.user = {};
      state.empireVersion = "";
      state.notifications = [];
    },
    clearState(state) {
      state.token = "";
      state.url = "";
      state.user = {};
      state.loginError = "";
      state.empireVersion = "";
      state.darkMode = true;
      state.chatWidget = true;
      state.hideStaleAgents = false;
      state.hideArchivedAgents = true;
      state.filterOnlyMyStagers = true;
      state.autoSubscribeAgents = true;
      state.agentHeaders = [];
      state.notifications = [];
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
    setAutoSubscribeAgents(state, val) {
      state.autoSubscribeAgents = val;
    },
    setAgentHeaders(state, val) {
      state.agentHeaders = val;
    },
    setNotifications(state, val) {
      state.notifications = val;
    },
    addNotification(state, notification) {
      state.notifications = [notification, ...state.notifications];
    },
  },
  actions: {
    async login(context, { url, socketUrl, username, password }) {
      try {
        context.commit("setLoginError", "");
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);
        const token = await axios.post(`${url}/token`, formData);

        const user = await axios.get(`${url}/api/v2/users/me`, {
          headers: { Authorization: `Bearer ${token.data.access_token}` },
        });
        const version = await axios.get(`${url}/api/v2/meta/version`, {
          headers: { Authorization: `Bearer ${token.data.access_token}` },
        });
        context.commit("setApplicationState", {
          token: token.data.access_token,
          url,
          socketUrl,
          user: user.data,
          version: version.data.version,
          notifications: [],
        });
      } catch (err) {
        let message = "";
        if (err.response && err.response.data) {
          message = err.response.data.detail;
        } else if (err.response && err.response.statusText) {
          message = err.response.statusText;
        } else {
          message = "Unable to connect to server.";
        }
        context.commit("setLoginError", message);
      }
    },
    addNotification(context, notification) {
      context.commit("addNotification", notification);
    },
    markAllNotificationsAsRead(context) {
      const notifications = context.state.notifications.map((n) => {
        const notification = n;
        notification.read = true;
        return notification;
      });
      context.commit("setNotifications", notifications);
    },
    clearNotifications(context) {
      context.commit("setNotifications", []);
    },
    connectionError(context) {
      context.commit("setConnectionError");
    },
    async logout(context) {
      context.commit("setLogout");
    },
    clear(context) {
      context.commit("clearState");
    },
    darkMode(context, val) {
      context.commit("setDarkMode", val);
    },
    chatWidget(context, val) {
      context.commit("setChatWidget", val);
    },
    hideStaleAgents(context, val) {
      context.commit("setHideStaleAgents", val);
    },
    hideArchivedAgents(context, val) {
      context.commit("setHideArchivedAgents", val);
    },
    filterOnlyMyStagers(context, val) {
      context.commit("setFilterOnlyMyStagers", val);
    },
    autoSubscribeAgents(context, val) {
      context.commit("setAutoSubscribeAgents", val);
    },
    agentHeaders(context, val) {
      context.commit("setAgentHeaders", val);
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
    isAutoSubscribeAgents(state) {
      return state.autoSubscribeAgents;
    },
    token(state) {
      return state.token;
    },
    socketUrl(state) {
      return state.socketUrl;
    },
  },
};
