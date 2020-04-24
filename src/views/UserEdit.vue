<template>
  <div>
    <v-breadcrumbs :items="breads" />
    <h3>{{ id ? 'Edit' : 'New' }} User</h3>
    <v-card style="padding: 10px">
      <v-form
        ref="form"
        v-model="valid"
        style="max-width: 500px"
      >
        <v-text-field
          v-model="form.username"
          :rules="rules['name']"
          label="Username"
          outlined
          dense
          required
        />
        <v-text-field
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
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
          :append-icon="showConfirm ? 'mdi-eye' : 'mdi-eye-off'"
          :rules="rules['confirmPassword']"
          label="Confirm Password"
          autocomplete="off"
          outlined
          dense
          required
          @click:append="showConfirm = !showConfirm"
        />
        <v-btn
          class="mt-4 primary"
          :loading="loading"
          @click="submit"
        >
          submit
        </v-btn>
      </v-form>
    </v-card>
  </div>
</template>

<script>
import * as userApi from '@/api/user-api';

export default {
  name: 'UserEdit',
  data() {
    return {
      form: {},
      rules: {
        name: [],
        password: [],
        confirmPassword: [],
      },
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
          text: 'Users',
          disabled: false,
          to: '/users',
          exact: true,
        },
        {
          text: this.id ? `Edit ${this.id}` : 'New',
          disabled: true,
          to: '/users-edit',
        },
      ];
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
      if (this.loading) {
        return;
      }

      try {
        await this.$confirm('Do you want to create this user?');
      } catch (err) {
        return;
      }

      this.loading = true;
      await this.create();
      this.loading = false;
    },
    create() {
      return userApi.createUser(this.form.username, this.form.password)
        .then(() => this.$router.push({ name: 'users' })) // I'd route to userEdit but the user endpoint doesn't return the created object or its id. Api upgrades needed :(
        .catch(err => this.$notify.error({
          title: 'Error Creating User',
          message: err,
        }));
    },
    getUser(id) {
      userApi.getUser(id)
        .then((data) => {
          this.user = data;
        });
    },
  },
};
</script>

<style>

</style>
