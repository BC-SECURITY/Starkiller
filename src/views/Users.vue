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
          :to="{ name: 'userEdit', params: { id: item.ID } }"
        >
          {{ item.username }}
        </router-link>
        <span v-else>{{ item.username }}</span>
      </template>
      <template #item.last_logon_time="{ item }">
        <v-tooltip top>
          <template #activator="{ on }">
            <span v-on="on">{{ moment(item.last_logon_time).fromNow() }}</span>
          </template>
          <span>{{ moment(item.last_logon_time).format('lll') }}</span>
        </v-tooltip>
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
                @click.stop="disableUser(item)"
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
        { text: 'id', align: 'start', value: 'ID' },
        { text: 'Name', value: 'username' },
        { text: 'Last Logon', value: 'last_logon_time' },
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
      // eslint-disable-next-line no-param-reassign
      item.enabled = !item.enabled;

      userApi.disableUser(item.ID, !item.enabled)
        .catch((err) => {
          this.$snack.error(`Error: ${err}`);
          item.enabled = !item.enabled; // eslint-disable-line no-param-reassign
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
