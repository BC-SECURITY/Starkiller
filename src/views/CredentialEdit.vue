<template>
  <div>
    <v-breadcrumbs :items="breads" />
    <h3>{{ id ? 'Edit' : 'New' }} Credential</h3>
    <v-card style="padding: 10px">
      <general-form
        v-if="reset"
        :options="options"
        :loading="loading"
        @submit="submit"
      />
    </v-card>
  </div>
</template>

<script>
import * as credentialApi from '@/api/credential-api';
import GeneralForm from '@/components/GeneralForm.vue';

export default {
  name: 'CredentialEdit',
  components: {
    GeneralForm,
  },
  data() {
    return {
      reset: true,
      options: {
        credtype: {
          Required: true,
          Strict: true,
          SuggestedValues: [
            'plaintext', 'hash',
          ],
        },
        domain: { Required: true },
        username: { Required: true },
        password: { Required: true },
        host: { Required: true },
        os: { Required: false },
        sid: { Required: false },
        notes: { Required: false },
      },
      loading: false,
    };
  },
  computed: {
    breads() {
      return [
        {
          text: 'Credentials',
          disabled: false,
          to: '/credentials',
          exact: true,
        },
        {
          text: this.id ? `${this.id}` : 'New',
          disabled: true,
          to: '/credential-edit',
        },
      ];
    },
    isNew() {
      return this.$route.name === 'credentialNew';
    },
    id() {
      return this.$route.params.id;
    },
  },
  methods: {
    async submit(form) {
      if (this.loading) {
        return;
      }

      this.loading = true;
      if (this.isNew) {
        await this.create(form);
      }
      this.loading = false;
    },
    create(form) {
      return credentialApi.createCredential({ credentials: [form] })
        .then(() => this.$router.push({ name: 'credentials' }))
        .catch(err => this.$toast.error(`Error: ${err}`));
    },
  },
};
</script>

<style>

</style>
