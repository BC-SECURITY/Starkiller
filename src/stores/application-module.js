import { defineStore } from "pinia";
import axios from "axios";
import { setInstance } from "@/api/axios-instance";

// eslint-disable-next-line import/prefer-default-export
export const useApplicationStore = defineStore("application", {
  persist: {
    afterRestore: (ctx) => {
      setInstance(ctx.store.url, ctx.store.token);
    },
  },
  state: () => ({
    token: "",
    url: "",
    socketUrl: "",
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
  }),
  actions: {
    async login({ url, socketUrl, username, password }) {
      try {
        this.loginError = "";
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);
        const tokenResponse = await axios.post(`${url}/token`, formData);

        const userResponse = await axios.get(`${url}/api/v2/users/me`, {
          headers: {
            Authorization: `Bearer ${tokenResponse.data.access_token}`,
          },
        });
        const versionResponse = await axios.get(`${url}/api/v2/meta/version`, {
          headers: {
            Authorization: `Bearer ${tokenResponse.data.access_token}`,
          },
        });

        this.token = tokenResponse.data.access_token;
        this.url = url;
        this.socketUrl = socketUrl;
        this.user = userResponse.data;
        this.empireVersion = versionResponse.data.version;
        this.notifications = [];

        setInstance(url, tokenResponse.data.access_token);
      } catch (err) {
        this.loginError = this.extractErrorMessage(err);
      }
    },
    extractErrorMessage(err) {
      if (err.response && err.response.data) {
        return err.response.data.detail;
      }
      if (err.response && err.response.statusText) {
        return err.response.statusText;
      }
      return "Unable to connect to server.";
    },
    async refreshMe() {
      const userResponse = await axios.get(`${this.url}/api/v2/users/me`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      this.user = userResponse.data;
    },
    addNotification(notification) {
      this.notifications = [notification, ...this.notifications];
    },
    markAllNotificationsAsRead() {
      this.notifications = this.notifications.map((n) => ({
        ...n,
        read: true,
      }));
    },
    clearNotifications() {
      this.notifications = [];
    },
    async logout() {
      this.token = "";
      this.url = "";
      this.socketUrl = "";
      this.user = {};
      this.empireVersion = "";
      this.notifications = [];
    },
    clear() {
      this.token = "";
      this.url = "";
      this.user = {};
      this.loginError = "";
      this.empireVersion = "";
      this.darkMode = true;
      this.chatWidget = true;
      this.hideStaleAgents = false;
      this.hideArchivedAgents = true;
      this.filterOnlyMyStagers = true;
      this.autoSubscribeAgents = true;
      this.agentHeaders = [];
      this.notifications = [];
    },
  },
  getters: {
    isLoggedIn: (state) => state.token.length > 0,
    isAdmin: (state) => state.user.is_admin === true,
  },
});
