<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="isAdmin"
      :show-refresh="true"
      :show-delete="false"
      @create="create"
      @refresh="getUsers"
    />
    <v-data-table :headers="headers" :items="users" density="compact">
      <template #item.username="{ item }">
        <router-link
          v-if="isAdmin"
          style="color: inherit"
          :to="{ name: 'userEdit', params: { id: item.id } }"
        >
          {{ item.username }}
        </router-link>
        <span v-else>{{ item.username }}</span>
      </template>
      <template #item.is_admin="{ item }">
        <v-checkbox
          v-model="item.is_admin"
          color="primary"
          density="compact"
          hide-details
          disabled
        />
      </template>
      <template #item.actions="{ item }">
        <v-tooltip v-if="isAdmin" :disabled="!item.admin" location="top">
          <template #activator="{ props: activatorProps }">
            <div style="max-width: 120px" v-bind="activatorProps">
              <v-switch
                v-model="item.enabled"
                color="primary"
                density="compact"
                hide-details
                :disabled="item.admin"
                label="Enabled"
                @update:model-value="disableUser(item)"
              />
            </div>
          </template>
          <span>Cannot disable admin user</span>
        </v-tooltip>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapState } from "pinia";
import * as userApi from "@/api/user-api";
import ListPageTop from "@/components/ListPageTop.vue";
import { useUserStore } from "@/stores/user-module";
import { useApplicationStore } from "@/stores/application-module";

export default {
  name: "Users",
  components: {
    ListPageTop,
  },
  inject: ["snack"],
  data() {
    return {
      breads: [
        {
          title: "Users",
          disabled: true,
          href: "/users",
        },
      ],
      headers: [
        { title: "Name", key: "username" },
        { title: "Is Admin", key: "is_admin" },
        { title: "Actions", key: "actions", sortable: false },
      ],
    };
  },
  computed: {
    userStore() {
      return useUserStore();
    },
    users() {
      return this.userStore.users;
    },
    ...mapState(useApplicationStore, ["isAdmin"]),
  },
  mounted() {
    this.getUsers();
  },
  methods: {
    create() {
      this.$router.push({ name: "userNew" });
    },
    async disableUser(item) {
      userApi.updateUser(item).catch((err) => {
        this.snack.error(`Error: ${err}`);
        item.enabled = !item.enabled;
      });
    },
    getUsers() {
      this.userStore.getUsers();
    },
  },
};
</script>

<style></style>
