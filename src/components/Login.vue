<template>
  <div class="hello">
    <v-form
      class="inputs"
      @submit.prevent.native="submit"
    >
      <v-text-field
        v-model="form.url"
        label="Url"
        dense
        outlined
      />
      <v-text-field
        v-model="form.username"
        label="Username"
        dense
        outlined
      />
      <v-text-field
        v-model="form.password"
        label="Password"
        :type="showPassword ? 'text' : 'password'"
        :append-icon="showPassword ? 'fa-eye' : 'fa-eye-slash'"
        outlined
        dense
        @click:append="showPassword = !showPassword"
      />
      <v-checkbox
        v-model="rememberMe"
        label="Remember URL and Username"
      />
      <v-btn
        color="primary"
        type="submit"
        :loading="loading"
        rounded
      >
        Submit
      </v-btn>
    </v-form>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import electronStore from '@/store/electron-store';

export default {
  name: 'Login',
  data() {
    return {
      loading: false,
      showPassword: false,
      rememberMe: false,
      form: {
        url: '',
        username: '',
        password: '',
      },
    };
  },
  computed: {
    ...mapGetters({
      isLoggedIn: 'application/isLoggedIn',
    }),
    ...mapState({
      loginError: state => state.application.loginError,
    }),
  },
  watch: {
    loginError(val) {
      if (val.length > 0) {
        this.loading = false;
        this.$toast.error(`Error Logging In: ${val}`);
      }
    },
  },
  mounted() {
    this.form.url = electronStore.get('url', '');
    this.form.username = electronStore.get('username', '');
    this.rememberMe = electronStore.get('rememberMe', false);
  },
  methods: {
    submit() {
      const cleanedUrl = (this.form.url.startsWith('http://') || this.form.url.startsWith('https://'))
        ? this.form.url
        : `https://${this.form.url}`;
      this.loading = true;
      electronStore.set('rememberMe', this.rememberMe);

      if (this.rememberMe === true) {
        electronStore.set('url', cleanedUrl);
        electronStore.set('username', this.form.username);
      } else {
        electronStore.delete('url');
        electronStore.delete('username');
      }

      this.$store.dispatch('application/login', { url: cleanedUrl, username: this.form.username, password: this.form.password });
    },
  },
};
</script>

<style scoped lang="scss">
</style>
