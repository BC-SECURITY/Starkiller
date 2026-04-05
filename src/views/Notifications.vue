<template>
  <div>
    <list-page-top
      :breads="[
        {
          title: 'Notifications',
          disabled: true,
          to: '/notifications',
        },
      ]"
    >
      <template #extra-stuff>
        <v-btn color="primary" variant="text" @click="clearNotifications">
          Clear
          <v-icon end> mdi-delete </v-icon>
        </v-btn>
      </template>
    </list-page-top>
    <v-card
      class="mr-2 pa-2"
      elevation="2"
      variant="outlined"
      style="flex-basis: 250px"
    >
      <v-list>
        <template v-for="(item, i) in notifications" :key="i">
          <v-list-item
            :value="i"
            :style="
              item.read ? '' : 'background-color: rgba(118, 127, 134, 0.5);'
            "
            :to="item.route"
            link
          >
            <v-list-item-title>
              {{ item.title }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ item.text }}
            </v-list-item-subtitle>
            <template #append>
              <v-btn
                v-if="item.route"
                color="primary"
                variant="text"
                @click.stop="$router.push(item.route)"
              >
                {{ item.buttonText }}
              </v-btn>
            </template>
          </v-list-item>
          <v-divider />
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
  beforeUnmount() {
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
