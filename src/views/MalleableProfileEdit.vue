<template>
  <div>
    <edit-page-top
      :breads="breads"
      :show-submit="initialLoad"
      :disable-submit="!canEdit && initialLoad"
      :show-copy="id > 0 && initialLoad"
      :show-delete="id > 0 && initialLoad"
      :submit-loading="loading && initialLoad"
      :copy-link="copyLink"
      :small-copy="true"
      :small-delete="true"
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
      malleableProfile: {},
      valid: true,
      loading: false,
      errorState: false,
      initialLoad: false,
    };
  },
  computed: {
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
      return true;
    },
    id() {
      return this.isCopy ? 0 : this.$route.params.id;
    },
    copyLink() {
      if (this.id > 0) return { name: 'malleableProfileNew', params: { copy: true, id: this.id } };
      return {};
    },
    breads() {
      return [
        {
          text: 'Malleable Profiles',
          disabled: false,
          to: '/malleable-profiles',
          exact: true,
        },
        {
          text: this.breadcrumbName,
          disabled: true,
          to: '/malleable-profiles-edit',
        },
      ];
    },
    breadcrumbName() {
      if (this.isCopy) return 'New';
      if (this.malleableProfile.name) return this.malleableProfile.name;
      if (this.id) return this.id;
      return 'New';
    },
  },
  watch: {
    id(val) {
      if (val) {
        this.getMalleableProfile(val);
      }
    },
  },
  mounted() {
    if (!this.isNew || this.isCopy) {
      // using the route param id instad of this.id
      // since this.id is 0 for copies.
      this.getMalleableProfile(this.$route.params.id);
    } else {
      this.initialLoad = true;
    }
  },
  methods: {
    async submit() {
      if (this.loading || !this.$refs.form.validate()) {
        return;
      }

      this.loading = true;
      if (this.id > 0) {
        malleableApi.updateMalleableProfile(this.id, this.form.data)
          .then(() => {
            this.$snack.success('Malleable Profile updated');
            this.loading = false;
          })
          .catch((err) => {
            this.$snack.error(`Error: ${err}`);
            this.loading = false;
          });
      } else {
        malleableApi.createMalleableProfile(this.form.name, this.form.category, this.form.data)
          .then(({ id }) => {
            this.$snack.success('Malleable Profile created');
            this.loading = false;
            this.$router.push({ name: 'malleableProfileEdit', params: { id } });
          })
          .catch((err) => {
            this.$snack.error(`Error: ${err}`);
            this.loading = false;
          });
      }
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
    getMalleableProfile(id) {
      malleableApi.getMalleableProfile(id)
        .then((data) => {
          this.malleableProfile = data;
          this.initialLoad = true;
          Vue.set(this, 'form', { ...data });
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
