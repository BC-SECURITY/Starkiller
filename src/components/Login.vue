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
      <div
        v-if="!editSocket"
        style="margin-top: -30px; margin-bottom: 20px;"
      >
        <span class="caption grey--text font-weight-light">SocketIO: {{ form.socketUrl }}</span>
        <v-icon
          class="point"
          small
          @click="editSocket = true"
        >
          mdi-pencil
        </v-icon>
      </div>
      <v-text-field
        v-else
        v-model="form.socketUrl"
        label="SocketIO Url"
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
      editSocket: false,
      form: {
        url: '',
        username: '',
        password: '',
        socketUrl: '',
      },
    };
  },
  computed: {
    ...mapGetters({
      isLoggedIn: 'application/isLoggedIn',
    }),
    ...mapState({
      loginError: (state) => state.application.loginError,
    }),
  },
  watch: {
    'form.url': {
      handler(val) {
        try {
          const cleanedUrl = (val.startsWith('http://') || val.startsWith('https://'))
            ? val
            : `https://${val}`;
          const url = new URL(cleanedUrl);
          this.form.socketUrl = `wss://${url.hostname}:5000`;
        } catch (err) {
          // noop
        }
      },
    },
    loginError(val) {
      if (val.length > 0) {
        this.loading = false;
        this.$snack.error(`Error Logging In: ${val}`);
      }
    },
  },
  mounted() {
    this.form.url = electronStore.get('url', 'https://localhost:1337');
    this.form.username = electronStore.get('username', '');
    this.rememberMe = electronStore.get('rememberMe', false);
    this.$nextTick(() => {
      // this is in nextTick to allow us to write a saved socketUrl
      // after the 'form.url' watcher.
      const socketUrl = electronStore.get('socketUrl', '');
      if (socketUrl !== '') {
        this.form.socketUrl = socketUrl;
      }
    });
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
        electronStore.set('socketUrl', this.form.socketUrl);
        electronStore.set('username', this.form.username);
      } else {
        electronStore.delete('url');
        electronStore.delete('username');
      }

      this.$store.dispatch('application/login', {
        url: cleanedUrl,
        socketUrl: this.form.socketUrl,
        username: this.form.username,
        password: this.form.password,
      });
    },
  },
};
</script>

<style scoped lang="scss">
</style>
