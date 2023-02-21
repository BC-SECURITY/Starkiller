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
    <v-data-table
      :headers="headers"
      :items="users"
      dense
    >
      <template #item.username="{ item }">
        <router-link
          v-if="isAdmin"
          style="color: inherit;"
          :to="{ name: 'userEdit', params: { id: item.id } }"
        >
          {{ item.username }}
        </router-link>
        <span v-else>{{ item.username }}</span>
      </template>
      <template #item.is_admin="{ item }">
        <v-simple-checkbox
          v-model="item.is_admin"
          disabled
        />
      </template>
      <template #item.actions="{ item }">
        <v-tooltip
          v-if="isAdmin"
          :disabled="!item.admin"
          top
        >
          <template #activator="{ on }">
            <div
              style="max-width: 120px"
              v-on="on"
            >
              <v-switch
                v-model="item.enabled"
                :disabled="item.admin"
                label="Enabled"
                v-on="on"
                @change="disableUser(item)"
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
import { mapState, mapGetters } from 'vuex';
import * as userApi from '@/api/user-api';
import moment from 'moment';
import ListPageTop from '@/components/ListPageTop.vue';

export default {
  name: 'Users',
  components: {
    ListPageTop,
  },
  data() {
    return {
      moment,
      breads: [
        {
          text: 'Users',
          disabled: true,
          href: '/users',
        },
      ],
      headers: [
        { text: 'Name', value: 'username' },
        { text: 'Is Admin', value: 'is_admin' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
    };
  },
  computed: {
    ...mapState({
      users: (state) => state.user.users,
    }),
    ...mapGetters({
      isAdmin: 'application/isAdmin',
    }),
  },
  mounted() {
    this.getUsers();
  },
  methods: {
    create() {
      this.$router.push({ name: 'userNew' });
    },
    async disableUser(item) {
      userApi.updateUser(item)
        .catch((err) => {
          this.$snack.error(`Error: ${err}`);
          item.enabled = !item.enabled;
        });
    },
    getUsers() {
      this.$store.dispatch('user/getUsers');
    },
  },
};
</script>

<style>

</style>
