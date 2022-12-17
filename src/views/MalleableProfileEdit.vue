<template>
  <div>
    <edit-page-top
      :breads="breads"
      :show-submit="true"
      :show-copy="true"
      :show-delete="!canEdit"
      :submit-loading="loading"
      :copy-link="copyLink"
      @submit="submit"
      @delete="deleteMalleableProfile"
    />
    <div class="headers">
      <h3>{{ mode }} Malleable Profile</h3>
    </div>
    <error-state-alert
      v-if="errorState"
      :resource-id="id"
      resource-type="malleableProfile"
    />
    <v-card
      v-else
      style="padding: 10px"
    >
      <v-form
        ref="form"
        v-model="valid"
        style="max-width: 500px"
        @submit.prevent.native="submit"
      >
        <v-text-field
          v-model="form.name"
          :rules="rules['name']"
          label="name"
          outlined
          dense
          required
          :disabled="!isNew"
        />
        <v-text-field
          v-model="form.category"
          :rules="rules['category']"
          label="category"
          outlined
          dense
          required
          :disabled="!isNew"
        />
        <v-textarea
          v-model="form.data"
          :rules="rules['code']"
          label="code"
          outlined
          dense
          required
          auto-grow
        />
      </v-form>
    </v-card>
  </div>
</template>

<script>
import Vue from 'vue';
import ErrorStateAlert from '@/components/ErrorStateAlert.vue';
import EditPageTop from '@/components/EditPageTop.vue';
import * as malleableApi from '@/api/malleable-api';

export default {
  name: 'MalleableProfileEdit',
  components: {
    ErrorStateAlert,
    EditPageTop,
  },
  data() {
    return {
      form: {},
      rules: {
        name: [
          (v) => !!v || 'Name is required',
          (v) => (!!v && v.length > 3) || 'Name must be larger than 3 characters',
        ],
        category: [
          (v) => !!v || 'Category is required',
        ],
        code: [
          (v) => !!v || 'Code is required',
        ],
      },
      profile: {},
      valid: true,
      loading: false,
      errorState: false,
    };
  },
  computed: {
    breads() {
      return [
        {
          text: 'Malleable Profiles',
          disabled: false,
          to: '/malleable-profiles',
          exact: true,
        },
        {
          text: this.id && !this.isCopy ? `${this.id}` : 'New',
          disabled: true,
          to: '/malleable-profiles-edit',
        },
      ];
    },
    isNew() {
      return this.$route.name === 'malleableProfileNew';
    },
    isCopy() {
      return this.$route.params.copy === true;
    },
    mode() {
      if (this.isCopy) return 'Copy';
      if (this.isNew) return 'New';
      return 'View';
    },
    canEdit() {
      return this.isNew;
    },
    id() {
      return this.$route.params.id;
    },
    copyLink() {
      if (!this.canEdit) return { name: 'malleableProfileNew', params: { copy: true, id: this.id } };
      return {};
    },
  },
  mounted() {
    if (!this.isNew || this.isCopy) {
      this.getMalleableProfile(this.id);
    }
  },
  methods: {
    async submit() {
      if (this.loading || !this.$refs.form.validate()) {
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
      return malleableApi.createMalleableProfile(this.form.name, this.form.category, this.form.data)
        .then(() => this.$router.push({ name: 'malleableProfileEdit', params: { id: this.form.name } }))
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    update() {
      return malleableApi.updateMalleableProfile(this.form.name, this.form.data)
        .then(() => this.$router.push({ name: 'malleableProfiles' }))
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    getMalleableProfile(id) {
      malleableApi.getMalleableProfile(id)
        .then((data) => {
          this.malleableProfile = data;
          Vue.set(this, 'form', { ...data });
        })
        .catch(() => {
          this.errorState = true;
        });
    },
    async deleteMalleableProfile() {
      if (await this.$root.$confirm('Delete', `Are you sure you want to delete profile ${this.form.name}?`, { color: 'red' })) {
        try {
          await this.$store.dispatch('malleable/deleteMalleableProfile', this.form.name);
          this.$router.push({ name: 'malleableProfiles' });
        } catch (err) {
          this.$snack.error(`Error: ${err}`);
        }
      }
    },
  },
};
</script>

<style>

</style>
