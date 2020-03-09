<template>
  <div class="route-container">
    <div class="headers">
      <h3>Users</h3>
      <el-button
        type="primary"
        round
        @click="create"
      >
        Create User
      </el-button>
    </div>
    <user-viewer
      :visible="visible"
      :view="view"
      :view-object="viewObject"
      @close="close"
    />
    <el-table
      :data="users"
      class="main-table"
      :row-class-name="tableRowClassName"
      @row-click="viewUser"
    >
      <el-table-column
        prop="ID"
        label="id"
        sortable
      />
      <el-table-column
        prop="username"
        label="Name"
        sortable
      />
      <el-table-column
        prop="last_logon_time"
        label="Last Logon"
        sortable
      >
        <template slot-scope="scope">
          <el-tooltip :content="moment(scope.row.last_logon_time).format('lll')">
            <div>{{ moment(scope.row.last_logon_time).fromNow() }}</div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        fixed="right"
        label="Operations"
        width="120"
      >
        <template slot-scope="scope">
          <el-tooltip
            :disabled="!users[scope.$index].admin"
            content="Cannot disable admin user"
          >
            <el-switch
              v-model="users[scope.$index].enabled"
              :disabled="users[scope.$index].admin"
              inactive-color="#ff4949"
              @change="disableUser($event, scope.$index, users)"
            />
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
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
    this.moment = moment;
  },
  methods: {
    create() {
      this.visible = true;
    },
    close() {
      this.visible = false;
      this.view = false;
      this.viewObject = {};
      this.getUsers();
    },
    async disableUser(enabled, index, rows) {
      try {
        await this.$confirm(`Are you sure you want to ${enabled ? 'enable' : 'disable'} user ${rows[index].username}?`);
      } catch (err) {
        rows[index].enabled = !enabled; // eslint-disable-line no-param-reassign
        return;
      }

      userApi.disableUser(rows[index].ID, !enabled)
        .catch((err) => {
          this.$notify.error({
            title: 'Error',
            message: err,
          });
          rows[index].enabled = !enabled; // eslint-disable-line no-param-reassign
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
    tableRowClassName({ row }) {
      if (row.enabled === false) {
        return 'warning-row';
      }
      return 'l';
    },
  },
};
</script>

<style>

</style>
