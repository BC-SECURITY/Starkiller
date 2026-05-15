// e2e/helpers/auth.js
//
// setFakeAuth: pre-populates the persisted slice of useApplicationStore in
// localStorage so the app boots already-authenticated. Mirrors the persisted
// state shape (everything except fields named in the store's `persist.omit`
// array — currently chatUnreadCount). If the store gains a new persisted
// field that the UI reads on boot, add it here too.
//
// loginViaForm: walks through the real Login.vue form. Used only by
// login.spec.js; every other spec uses setFakeAuth to skip the form.

export async function setFakeAuth(page, { admin = false } = {}) {
  await page.addInitScript(
    (opts) => {
      const state = {
        token: "fake-test-token",
        url: "http://localhost:1337",
        socketUrl: "ws://localhost:1337",
        user: { id: 1, username: "test", is_admin: opts.admin },
        loginError: "",
        empireVersion: "0.0.0-test",
        chatWidget: true,
        hideStaleAgents: false,
        hideArchivedAgents: true,
        filterOnlyMyStagers: true,
        autoSubscribeAgents: true,
        agentHeaders: [],
        taskHeaders: [],
        pluginTaskHeaders: [],
        connectionError: 0,
        notifications: [],
      };
      localStorage.setItem("application", JSON.stringify(state));
    },
    { admin },
  );
}

export async function loginViaForm(page, { url, username, password }) {
  await page.goto("/");
  // Exact-match avoids colliding with the "Remember URL and Username"
  // checkbox which would otherwise match /url/i.
  await page.getByLabel("Url", { exact: true }).fill(url);
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Submit" }).click();
}
