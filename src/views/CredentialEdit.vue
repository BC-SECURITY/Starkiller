<template>
  <div>
    <v-breadcrumbs :items="breads" />
    <h3>{{ id ? 'Edit' : 'New' }} User</h3>
    <v-card style="padding: 10px">
      <v-form
        ref="form"
        v-model="valid"
        style="max-width: 500px"
        @submit.prevent.native="submit"
      >
        <v-select
          v-model="form.credtype"
          :items="credentialTypes"
          label="Credential Type"
          outlined
          dense
          required
        />
        <v-text-field
          v-for="field in requiredFields"
          :key="field"
          v-model="form[field]"
          :rules="rules[field]"
          :label="field"
          outlined
          dense
          required
          :disabled="!isNew"
        />
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-header>Optional Fields</v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-text-field
                v-for="field in optionalFields"
                :key="field"
                v-model="form[field]"
                :rules="rules[field]"
                :label="field"
                outlined
                dense
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-btn
          type="submit"
          class="mt-4 primary"
          :loading="loading"
        >
          submit
        </v-btn>
      </v-form>
    </v-card>
  </div>
</template>

<script>
import * as credentialApi from '@/api/credential-api';

export default {
  name: 'CredentialEdit',
  data() {
    return {
      form: {
        credtype: 'hash',
      },
      requiredFields: ['domain', 'username', 'password', 'host'],
      optionalFields: ['os', 'sid', 'notes'],
      credentialTypes: ['plaintext', 'hash'],
      user: {},
      valid: true,
      loading: false,
      showPassword: false,
      showConfirm: false,
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
    rules() {
      return this.requiredFields.reduce((map, field) => {
        // eslint-disable-next-line no-param-reassign
        map[field] = [];
        map[field].push(
          v => (!!v || v === 0) || `${field} is required`,
        );
        return map;
      }, {});
    },
    isNew() {
      return this.$route.name === 'credentialNew';
    },
    id() {
      return this.$route.params.id;
    },
  },
  methods: {
    async submit() {
      if (this.loading || !this.$refs.form.validate()) {
        return;
      }

      this.loading = true;
      if (this.isNew) {
        await this.create();
      }
      this.loading = false;
    },
    create() {
      return credentialApi.createCredential({ credentials: [this.form] })
        .then(() => this.$router.push({ name: 'credentials' }))
        .catch(err => this.$toast.error(`Error: ${err}`));
    },
  },
};
</script>

<style>

</style>
