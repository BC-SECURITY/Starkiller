<template>
  <div class="pt-2">
    <v-menu v-model="menu" offset-y>
      <template #activator="{ on, attrs }">
        <v-btn class="text-none mr-5" stacked icon v-bind="attrs" v-on="on">
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
          :style="
            item.read ? '' : 'background-color: rgba(118, 127, 134, 0.5);'
          "
        >
          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
            <v-list-item-subtitle>{{ item.text }}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn v-if="item.route" color="primary" text :to="item.route">
              {{ item.buttonText }}
            </v-btn>
          </v-list-item-action>
        </v-list-item>
        <v-list-item v-if="notifications.length === 0">
          <v-list-item-content>
            <v-list-item-title>No notifications</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <v-divider />
      <v-list>
        <v-list-item v-if="notifications.length > 0">
          <v-list-item-content style="cursor: pointer" @click="toNotifications">
            <v-list-item-title>View All</v-list-item-title>
          </v-list-item-content>
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
  mounted() {},
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
