<template>
  <div>
    <v-breadcrumbs :items="breads" />

    <div class="headers">
      <h3>Credentials</h3>
      <v-btn
        color="primary"
        rounded
        @click="create"
      >
        Add Credential
      </v-btn>
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
    create() {
      this.$router.push({ name: 'credentialNew' });
    },
  },
};
</script>

<style>

</style>
