// e2e/helpers/navigation.js

// Navigate between routes the way an in-app click does: an in-page hash
// assignment that vue-router's history listener observes, so the
// navigation flows through the router like a real click — components
// across different route records unmount/remount, and a same-route param
// change fires the existing instance's watchers instead. The two
// Playwright alternatives both sidestep this: goto() performs a
// same-document navigation over CDP that the history listener never sees
// (no remount, no watcher), and reload() re-runs setFakeAuth's
// addInitScript, resetting any persisted store the test has mutated. Use
// this whenever a test depends on unmount/remount or route-watcher
// behavior.
export async function navigateInApp(page, hash) {
  await page.evaluate((h) => {
    window.location.hash = h;
  }, hash);
}
