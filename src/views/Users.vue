<template>
  <div>
    <v-breadcrumbs :items="breads" />

    <div class="headers">
      <h3>Users</h3>
      <v-btn
        v-if="isAdmin"
        color="primary"
        rounded
        @click="create"
      >
        Create User
      </v-btn>
    </div>
    <v-data-table
      :headers="headers"
      :items="users"
      @click:row="viewUser"
    >
      <template v-slot:item.last_logon_time="{ item }">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <span v-on="on">{{ moment(item.last_logon_time).fromNow() }}</span>
          </template>
          <span>{{ moment(item.last_logon_time).format('lll') }}</span>
        </v-tooltip>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-tooltip
          v-if="isAdmin"
          :disabled="!item.admin"
          top
        >
          <template v-slot:activator="{ on }">
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

export default {
  name: 'Users',
  components: {
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
      users: state => state.user.users,
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
          this.$toast.error(`Error: ${err}`);
          item.enabled = !item.enabled; // eslint-disable-line no-param-reassign
        });
    },
    viewUser(item) {
      if (this.isAdmin === true) {
        this.$router.push({ name: 'userEdit', params: { id: item.ID } });
      }
    },
    getUsers() {
      this.$store.dispatch('user/getUsers');
    },
  },
};
</script>

<style>

</style>
