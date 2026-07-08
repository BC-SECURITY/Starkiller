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
    // forcedLogoutReason is intentionally never persisted -- it's a
    // same-session, fire-once signal for Login.vue to show a snack, not
    // something that should ever survive a reload into a future session.
    omit: ["chatUnreadCount", "forcedLogoutReason"],
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
    // Set by logout(reason) when the interceptor forces a logout (401/403).
    // Empty string means "no forced-logout message to show" -- cleared on
    // every login() attempt and by clear(), so it can never linger into an
    // unrelated future session or attempt. See the persist.omit note above.
    forcedLogoutReason: "",
    chatUnreadCount: 0,
    notifications: [],
    dashboardSelectedAgentIds: [],
    // Stats-page view preferences. Shared across all agents (a user who picks
    // "Hour" on agent A sees "Hour" on agent B) and intentionally survive
    // logout()/clear() — same precedent as dashboardSelectedAgentIds above.
    // Cross-user caveat (all survive-logout keys): on a shared machine User B
    // inherits User A's values. For dashboardSelectedAgentIds the leak is
    // mitigated by pruneSelection() (in Dashboard.vue — drops ids absent from
    // the current agent list); these timeframe prefs have no equivalent prune
    // (a stale timeframe is harmless). Don't "fix" the survive-logout behavior
    // without accounting for this.
    dashboardCheckinTimeframe: "Second",
    agentStatsCheckinTimeframe: "Second",
    agentStatsTaskTimeframe: "Day",
  }),
  actions: {
    async login({ url, socketUrl, username, password }) {
      try {
        this.loginError = "";
        // A fresh login attempt supersedes any prior forced-logout message.
        this.forcedLogoutReason = "";
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
    // `reason`, if given, is shown as a snack once Login.vue mounts (see its
    // forcedLogoutReason watcher) -- used by http.js's 401/403 interceptor
    // to explain a forced logout. The voluntary "Log Out" button in
    // Settings.vue calls this with no argument, which clears any stale
    // reason from a previous forced logout.
    async logout(reason = "") {
      this.token = "";
      this.url = "";
      this.socketUrl = "";
      this.user = {};
      this.empireVersion = "";
      this.notifications = [];
      this.forcedLogoutReason = reason;
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
      this.forcedLogoutReason = "";
    },
  },
  getters: {
    isLoggedIn: (state) => state.token.length > 0,
    isAdmin: (state) => state.user.is_admin === true,
  },
});
