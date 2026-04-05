<template>
  <div class="pt-2">
    <v-menu v-model="menu">
      <template #activator="{ props: activatorProps }">
        <v-btn
          class="text-none mr-5"
          variant="text"
          icon
          size="small"
          v-bind="activatorProps"
        >
          <v-badge v-if="unreadCount > 0" :content="unreadCount" color="error">
            <v-icon>mdi-bell-outline</v-icon>
          </v-badge>
          <v-icon v-else> mdi-bell-outline </v-icon>
        </v-btn>
      </template>
      <v-list style="max-height: 400px; overflow-y: auto">
        <v-list-item
          v-for="(item, index) in notifications"
          :key="index"
          :value="index"
          :style="
            item.read ? '' : 'background-color: rgba(118, 127, 134, 0.5);'
          "
        >
          <v-list-item-title>{{ item.title }}</v-list-item-title>
          <v-list-item-subtitle>{{ item.text }}</v-list-item-subtitle>
          <template #append>
            <v-btn
              v-if="item.route"
              color="primary"
              variant="text"
              @click="$router.push(item.route)"
            >
              {{ item.buttonText }}
            </v-btn>
          </template>
        </v-list-item>
        <v-list-item v-if="notifications.length === 0">
          <v-list-item-title>No notifications</v-list-item-title>
        </v-list-item>
      </v-list>
      <v-divider />
      <v-list>
        <v-list-item
          v-if="notifications.length > 0"
          style="cursor: pointer"
          @click="toNotifications"
        >
          <v-list-item-title>View All</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import { useApplicationStore } from "@/stores/application-module";

export default {
  name: "NotificationBell",
  data() {
    return {
      menu: false,
    };
  },
  computed: {
    applicationStore() {
      return useApplicationStore();
    },
    notifications() {
      return this.applicationStore.notifications;
    },
    unreadCount() {
      return this.notifications.filter((n) => !n.read).length;
    },
  },
  watch: {
    menu(val) {
      if (val === false) {
        this.markAsRead();
      }
    },
  },
  methods: {
    toNotifications() {
      this.$router.push({ name: "notifications" });
    },
    markAsRead() {
      this.applicationStore.markAllNotificationsAsRead();
    },
    push(notification) {
      notification.buttonText = notification.buttonText || "View";
      notification.read = false;
      this.applicationStore.addNotification(notification);
    },
  },
};
</script>

<style></style>
