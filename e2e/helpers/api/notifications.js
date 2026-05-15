// e2e/helpers/api/notifications.js
//
// Notifications live in the Pinia store, populated by socket events at
// runtime. Since sockets are blocked, this helper extends setFakeAuth's
// seed by injecting notifications into the persisted state directly.

export async function seedNotifications(page, notifications) {
  await page.addInitScript((items) => {
    const raw = localStorage.getItem("application");
    if (!raw) {
      throw new Error(
        "seedNotifications: localStorage 'application' is empty — call setFakeAuth before seedNotifications.",
      );
    }
    const state = JSON.parse(raw);
    state.notifications = items;
    localStorage.setItem("application", JSON.stringify(state));
  }, notifications);
}
