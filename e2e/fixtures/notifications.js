// e2e/fixtures/notifications.js
//
// Notifications.vue renders item.title and item.text (not item.message).
// The read field controls background color for unread items.
export const defaultNotifications = [
  {
    id: "n1",
    title: "Agent checked in",
    text: "ABC12345 from DESKTOP-1",
    read: false,
    timestamp: "2026-04-30T10:00:00Z",
  },
  {
    id: "n2",
    title: "Listener started",
    text: "http-1 is up",
    read: true,
    timestamp: "2026-04-30T11:00:00Z",
  },
];
