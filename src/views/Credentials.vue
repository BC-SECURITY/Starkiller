<template>
  <div class="route-container">
    <v-breadcrumbs :items="breads" />

    <div class="headers">
      <h3>Credentials</h3>
    </div>
    <v-data-table
      :headers="headers"
      :items="credentials"
    />
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
      breads: [
        {
          text: 'Credentials',
          disabled: true,
          href: '/credentials',
        },
      ],
      headers: [
        { text: 'id', value: 'ID' },
        { text: 'Name', value: 'name' },
        { text: 'CredType', value: 'credtype' },
        { text: 'Domain', value: 'domain' },
        { text: 'Host', value: 'host' },
        { text: 'Notes', value: 'notes' },
        { text: 'Password', value: 'password' },
        { text: 'SID', value: 'sid' },
        { text: 'Username', value: 'username' },
      ],
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
