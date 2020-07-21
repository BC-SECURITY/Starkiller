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
    >
      <template v-slot:item.username="{ item }">
        <div
          class="point"
          @click="copyToClipboard(item.username)"
        >
          {{ item.username }}
          <i class="fa fa-paperclip center-icon" />
        </div>
      </template>
      <template v-slot:item.password="{ item }">
        <div
          class="point"
          @click="copyToClipboard(item.password)"
        >
          {{ item.password }}
          <i class="fa fa-paperclip center-icon" />
        </div>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'Credentials',
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
        { text: 'Username', value: 'username' },
        { text: 'Password', value: 'password' },
        { text: 'Domain', value: 'domain' },
        { text: 'Host', value: 'host' },
        { text: 'Notes', value: 'notes' },
        { text: 'SID', value: 'sid' },
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
    // TODO: Add an endpoint to empire for getting and updating a single credential.
    // viewCredential(item) {
    //   this.$router.push({ name: 'credentialEdit', params: { id: item.id } });
    // },
    async copyToClipboard(val) {
      await navigator.clipboard.writeText(val);
      this.$toast.success('Output copied to clipboard');
    },
  },
};
</script>

<style>
.point:hover {
  cursor: pointer;
}
</style>
