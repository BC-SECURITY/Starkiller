<template>
  <div>
    <list-page-top
      :breads="[
        {
          text: 'Notifications',
          disabled: true,
          to: '/notifications',
        },
      ]"
    >
      <template #extra-stuff>
        <v-btn color="primary" text @click="clearNotifications">
          Clear
          <v-icon right> mdi-delete </v-icon>
        </v-btn>
      </template>
    </list-page-top>
    <v-card class="mr-2 pa-2" elevation="2" outlined style="flex-basis: 250px">
      <v-list>
        <template v-for="(item, i) in notifications">
          <v-list-item
            :key="`list-'${i}`"
            :style="
              item.read ? '' : 'background-color: rgba(118, 127, 134, 0.5);'
            "
            :to="item.route"
            link
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ item.title }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ item.text }}
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn v-if="item.route" color="primary" text :to="item.route">
                {{ item.buttonText }}
              </v-btn>
            </v-list-item-action>
          </v-list-item>
          <v-divider :key="`divider-${i}`" />
        </template>
      </v-list>
    </v-card>
  </div>
</template>

<script>
import ListPageTop from "@/components/ListPageTop.vue";
import { useApplicationStore } from "@/stores/application-module";

export default {
  name: "Notifications",
  components: { ListPageTop },
  computed: {
    applicationStore() {
      return useApplicationStore();
    },
    notifications() {
      return this.applicationStore.notifications;
    },
  },
  beforeDestroy() {
    this.applicationStore.markAllNotificationsAsRead();
  },
  methods: {
    clearNotifications() {
      this.applicationStore.clearNotifications();
    },
  },
};
</script>

<style></style>
