import { defineStore } from "pinia";
import { request, setInstance } from "@/api/http";

// Login deliberately bypasses the http.js wrapper so a failed login does NOT
// trigger logout() or bump connectionError. fetch does not throw on non-2xx,
// so we check res.ok and throw an axios-shaped error extractErrorMessage can read.
// (refreshMe goes through request() — it has the same logout-on-401 semantics
// as every other authenticated endpoint and benefits from the wrapper's error contract.)
async function rawFetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let data;
    try {
      data = await res.json();
    } catch {
      data = undefined;
    }
    const err = new Error(`HTTP ${res.status}`);
    err.response = { status: res.status, statusText: res.statusText, data };
    throw err;
  }
  return res.json();
}

// Monotonic counter for assigning stable notification ids. Combined with a
// timestamp so ids stay unique across page reloads (notifications persist).
let notificationCounter = 0;

// eslint-disable-next-line import/prefer-default-export
export const useApplicationStore = defineStore("application", {
  persist: {
    omit: ["chatUnreadCount"],
    afterHydrate: (ctx) => {
      try {
        setInstance(ctx.store.url, ctx.store.token);
      } catch (err) {
        // persistedstate swallows hook errors unless debug is enabled, and
        // this hook is the only path that re-initializes the API client
        // after a reload. Log explicitly so a failure here is visible instead
        // of later surfacing as an opaque uninitialized-client API crash.
        console.error(
          "[Starkiller] Failed to re-initialize API client after hydrate:",
          err,
        );
      }
      // Backfill ids on notifications persisted before ids existed, so
      // they don't all key on `undefined` after a reload.
      ctx.store.notifications.forEach((n) => {
        if (n.id == null) n.id = `${Date.now()}-${notificationCounter++}`;
      });
    },
  },
  state: () => ({
    token: "",
    url: "",
    socketUrl: "",
    user: {},
    loginError: "",
    empireVersion: "",
    chatWidget: true,
    hideStaleAgents: false,
    hideArchivedAgents: true,
    filterOnlyMyStagers: true,
    autoSubscribeAgents: true,
    agentHeaders: [],
    taskHeaders: [],
    pluginTaskHeaders: [],
    connectionError: 0,
    chatUnreadCount: 0,
    notifications: [],
  }),
  actions: {
    async login({ url, socketUrl, username, password }) {
      try {
        this.loginError = "";
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);
        const tokenData = await rawFetchJson(`${url}/token`, {
          method: "POST",
          body: formData,
        });

        const headers = {
          "X-Empire-Token": `Bearer ${tokenData.access_token}`,
        };
        const userData = await rawFetchJson(`${url}/api/v2/users/me`, {
          headers,
        });
        const versionData = await rawFetchJson(`${url}/api/v2/meta/version`, {
          headers,
        });

        this.token = tokenData.access_token;
        this.url = url;
        this.socketUrl = socketUrl;
        this.user = userData;
        this.empireVersion = versionData.version;
        this.notifications = [];

        setInstance(url, tokenData.access_token);
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
      this.user = await request.get("/users/me");
    },
    addNotification(notification) {
      const id = `${Date.now()}-${notificationCounter++}`;
      this.notifications = [{ id, ...notification }, ...this.notifications];
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
      this.chatWidget = true;
      this.hideStaleAgents = false;
      this.hideArchivedAgents = true;
      this.filterOnlyMyStagers = true;
      this.autoSubscribeAgents = true;
      this.agentHeaders = [];
      this.taskHeaders = [];
      this.pluginTaskHeaders = [];
      this.notifications = [];
    },
  },
  getters: {
    isLoggedIn: (state) => state.token.length > 0,
    isAdmin: (state) => state.user.is_admin === true,
  },
});
