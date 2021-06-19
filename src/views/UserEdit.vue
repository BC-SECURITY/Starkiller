<template>
  <div>
    <edit-page-top
      :breads="breads"
      :show-submit="true"
      :show-copy="false"
      :show-delete="false"
      :submit-loading="loading"
      @submit="create"
    />
    <h3>{{ id ? 'Edit' : 'New' }} User</h3>
    <error-state-alert
      v-if="errorState"
      :resource-id="id"
      resource-type="user"
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
          v-model="form.username"
          :rules="rules['name']"
          label="Username"
          outlined
          dense
          required
          :disabled="!isNew"
        />
        <v-text-field
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          :append-icon="showPassword ? 'fa-eye' : 'fa-eye-slash'"
          :rules="rules['password']"
          label="Password"
          autocomplete="off"
          outlined
          dense
          required
          @click:append="showPassword = !showPassword"
        />
        <v-text-field
          v-model="form.confirmPassword"
          :type="showConfirm ? 'text' : 'password'"
          :append-icon="showConfirm ? 'fa-eye' : 'fa-eye-slash'"
          :rules="rules['confirmPassword']"
          label="Confirm Password"
          autocomplete="off"
          outlined
          dense
          required
          @click:append="showConfirm = !showConfirm"
        />
      </v-form>
    </v-card>
  </div>
</template>

<script>
import Vue from 'vue';
import * as userApi from '@/api/user-api';
import ErrorStateAlert from '@/components/ErrorStateAlert.vue';
import EditPageTop from '@/components/EditPageTop.vue';

export default {
  name: 'UserEdit',
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
        password: [
          (v) => !!v || 'Password is required',
          (v) => (!!v && v.length > 5) || 'Password must be larger than 5 characters',
        ],
        confirmPassword: [
          (v) => !!v || 'Confirmation is required',
          (v) => v === this.form.password || 'Password must match',
        ],
      },
      user: {},
      valid: true,
      loading: false,
      showPassword: false,
      showConfirm: false,
      errorState: false,
    };
  },
  computed: {
    breads() {
      return [
        {
          text: 'Users',
          disabled: false,
          to: '/users',
          exact: true,
        },
        {
          text: this.breadcrumbName,
          disabled: true,
          to: '/users-edit',
        },
      ];
    },
    breadcrumbName() {
      if (this.user.username) return this.user.username;
      if (this.id) return this.id;
      return 'New';
    },
    isNew() {
      return this.$route.name === 'userNew';
    },
    id() {
      return this.$route.params.id;
    },
  },
  mounted() {
    if (!this.isNew) {
      this.getUser(this.id);
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
        await this.updatePassword();
      }
      this.loading = false;
    },
    create() {
      return userApi.createUser(this.form.username, this.form.password)
        .then(() => this.$router.push({ name: 'users' }))
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    updatePassword() {
      return userApi.updatePassword(this.id, this.form.password)
        .then(() => this.$router.push({ name: 'users' }))
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    getUser(id) {
      userApi.getUser(id)
        .then((data) => {
          this.user = data;
          Vue.set(this.form, 'username', data.username);
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
