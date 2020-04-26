<template>
  <div>
    <v-breadcrumbs :items="breads" />
    <div class="headers">
      <h3>Settings</h3>
    </div>
    <v-switch
      v-model="darkModeSwitch"
      :label="`Dark Mode`"
    />
    <div class="page">
      <div class="first-part">
        <span>{{ user.username }}</span>
        <v-btn
          color="primary"
          text
          @click="logout"
        >
          Logout
        </v-btn>
      </div>
      <v-divider />
      <div class="headers pl-0 mt-2">
        <h4>Update Password</h4>
      </div>
      <v-form
        ref="form"
        v-model="valid"
        style="max-width: 500px"
      >
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
          class="mt-4 mb-4 primary"
          :loading="loading"
          @click="submit"
        >
          submit
        </v-btn>
      </v-form>
      <v-divider />
      <div class="headers pl-0 mt-2">
        <h4> Api Token </h4>
      </div>
      <div
        class="point"
        @click="copyTokenToClipboard"
      >
        <span>{{ apiToken }}</span>
        <i class="fa fa-paperclip center-icon" />
      </div>
    </div>
  </div>
</template>

<script>
import * as userApi from '@/api/user-api';
import { mapState } from 'vuex';

export default {
  components: {
  },
  data() {
    return {
      form: {},
      rules: {
        password: [
          v => !!v || 'Password is required',
          v => (!!v && v.length > 5) || 'Password must be larger than 5 characters',
        ],
        confirmPassword: [
          v => !!v || 'Confirmation is required',
          v => v === this.form.password || 'Password must match',
        ],
      },
      showPassword: false,
      showConfirm: false,
      loading: false,
      valid: false,
      breads: [
        {
          text: 'Settings',
          disabled: true,
          href: '/settings',
        },
      ],
    };
  },
  computed: {
    ...mapState({
      user: state => state.profile.user,
      darkMode: state => state.profile.darkMode,
    }),
    apiToken() {
      return this.user.api_token;
    },
    userId() {
      return this.user.id;
    },
    darkModeSwitch: {
      set(val) {
        this.$store.dispatch('profile/darkMode', val);
      },
      get() {
        return this.darkMode;
      },
    },
  },
  methods: {
    async copyTokenToClipboard() {
      await navigator.clipboard.writeText(this.apiToken);
      this.$toast.success('Output copied to clipboard');
    },
    async logout() {
      if (await this.$root.$confirm('', 'Are you sure you want to logout?', { color: 'green' })) {
        this.$store.dispatch('profile/logout');
      }
    },
    submit() {
      if (this.$refs.form.validate()) {
        return userApi.updatePassword(this.user.id, this.form.password)
          .then(() => {
            this.$toast.success('Password updated');
            this.form = {};
            this.$refs.form.resetValidation();
          })
          .catch(err => this.$toast.error(`Error: ${err}`));
      }

      return false;
    },
  },
};
</script>

<style>
.point:hover {
  cursor: pointer;
}
</style>
