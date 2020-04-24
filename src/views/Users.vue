<template>
  <div class="route-container">
    <v-breadcrumbs :items="breads" />

    <div class="headers">
      <h3>Users</h3>
      <v-btn
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
          :disabled="!item.admin"
          top
        >
          <template v-slot:activator="{ on }">
            <div v-on="on">
              <v-switch
                v-model="item.enabled"
                :disabled="item.admin"
                label="Enabled"
                @change="disableUser($event, item)"
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
import { mapState } from 'vuex';
import UserViewer from '@/components/users/UserViewer.vue';
import * as userApi from '@/api/user-api';
import moment from 'moment';

export default {
  name: 'Users',
  components: {
    UserViewer,
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
      visible: false,
      view: false,
      viewObject: {},
    };
  },
  computed: {
    ...mapState({
      users: state => state.user.users,
    }),
  },
  mounted() {
    this.getUsers();
  },
  methods: {
    create() {
      this.visible = true;
      this.$router.push({ name: 'userNew' });
    },
    close() {
      this.visible = false;
      this.view = false;
      this.viewObject = {};
      this.getUsers();
    },
    async disableUser(enabled, item) {
      debugger;
      try {
        await this.$confirm(`Are you sure you want to ${enabled ? 'enable' : 'disable'} user ${item.username}?`);
      } catch (err) {
        item.enabled = !enabled; // eslint-disable-line no-param-reassign
        return;
      }

      userApi.disableUser(item.ID, !enabled)
        .catch((err) => {
          this.$notify.error({
            title: 'Error',
            message: err,
          });
          item.enabled = !enabled; // eslint-disable-line no-param-reassign
        });
    },
    viewUser(row, column) {
      if (column.label === 'Operations') {
        return;
      }

      this.visible = true;
      this.view = true;
      this.viewObject = row;
    },
    getUsers() {
      this.$store.dispatch('user/getUsers');
    },
  },
};
</script>

<style>

</style>
