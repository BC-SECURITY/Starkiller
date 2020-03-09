<template>
  <div class="route-container">
    <div class="headers">
      <h3>Credentials</h3>
    </div>
    <el-table
      :data="credentials"
      class="main-table"
    >
      <el-table-column
        prop="ID"
        label="id"
        sortable
      />
      <el-table-column
        prop="credtype"
        label="Credtype"
        sortable
      />
      <el-table-column
        prop="domain"
        label="Domain"
        sortable
        :show-overflow-tooltip="true"
      />
      <el-table-column
        prop="host"
        label="Host"
        sortable
        :show-overflow-tooltip="true"
      />
      <el-table-column
        prop="notes"
        label="Notes"
        sortable
      />
      <el-table-column
        prop="password"
        label="Password"
        sortable
      />
      <el-table-column
        prop="sid"
        label="SID"
        sortable
        :show-overflow-tooltip="true"
      />
      <el-table-column
        prop="username"
        label="Username"
        sortable
      />
    </el-table>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'Users',
  components: {
  },
  data() {
    return {
    };
  },
  computed: {
    ...mapState({
      credentials: state => state.credential.credentials,
    }),
  },
  mounted() {
    this.getCredentials();
  },
  methods: {
    getCredentials() {
      this.$store.dispatch('credential/getCredentials');
    },
  },
};
</script>

<style>

</style>
