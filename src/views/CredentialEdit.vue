<template>
  <div>
    <edit-page-top
      :breads="breads"
      :show-submit="true"
      :show-copy="false"
      :show-delete="!!id"
      :submit-loading="loading"
      @submit="submit"
      @delete="deleteCredential"
    />
    <h3>{{ mode }} Credential</h3>
    <error-state-alert
      v-if="errorState"
      :resource-id="id"
      resource-type="credential"
    />
    <v-card
      v-else
      style="padding: 10px"
    >
      <general-form
        v-if="reset"
        ref="generalform"
        v-model="form"
        :options="options"
        :readonly="!canEdit"
      />
    </v-card>
  </div>
</template>

<script>
import * as credentialApi from '@/api/credential-api';
import GeneralForm from '@/components/GeneralForm.vue';
import ErrorStateAlert from '@/components/ErrorStateAlert.vue';
import EditPageTop from '@/components/EditPageTop.vue';

export default {
  name: 'CredentialEdit',
  components: {
    GeneralForm,
    ErrorStateAlert,
    EditPageTop,
  },
  data() {
    return {
      reset: true,
      loading: false,
      initialLoad: true,
      credential: {},
      form: {},
      errorState: false,
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
          text: this.id && !this.isCopy ? `${this.id}` : 'New',
          disabled: true,
          to: '/credential-edit',
        },
      ];
    },
    isNew() {
      return this.$route.name === 'credentialNew';
    },
    isCopy() {
      return this.$route.params.copy === true;
    },
    mode() {
      if (this.isCopy) return 'Copy';
      if (this.isNew) return 'New';
      return 'Edit';
    },
    canEdit() {
      // if we want to introduce separate view/edit modes, we can do that here.
      return true;
    },
    id() {
      return this.$route.params.id;
    },
    options() {
      const op = {
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
      };
      Object.keys(this.credential).forEach((field) => {
        if (field !== 'ID') {
          op[field].Value = this.credential[field];
        }
      });
      return op;
    },
  },
  mounted() {
    if (!this.isNew || this.isCopy) {
      this.getCredential(this.id);
    }
  },
  methods: {
    async submit() {
      if (this.loading) {
        return;
      }

      this.loading = true;
      if (this.isNew) {
        await this.create();
      } else {
        await this.update();
      }
      this.loading = false;
    },
    create() {
      return credentialApi.createCredential(this.form)
        .then(() => this.$router.push({ name: 'credentials' }))
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    update() {
      return credentialApi.updateCredential(this.id, this.form)
        .then(() => this.$router.push({ name: 'credentials' }))
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    async deleteCredential() {
      if (await this.$root.$confirm('Delete', `Are you sure you want to delete credential ${this.id}?`, { color: 'red' })) {
        try {
          this.$store.dispatch('credential/deleteCredential', this.id);
          this.$router.push({ name: 'credentials' });
        } catch (err) {
          this.$snack.error(`Error: ${err}`);
        }
      }
    },
    getCredential(id) {
      credentialApi.getCredential(id)
        .then((data) => {
          this.reset = false;

          this.credential = data;
          this.initialLoad = false;
          setTimeout(() => { this.reset = true; }, 500);
        })
        .catch(() => {
          this.errorState = true;
        });
    },
  },
};
</script>

<style>

</style>
