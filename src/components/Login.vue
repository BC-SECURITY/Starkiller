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
        <!-- TODO I don't think this needs to be editable anymore -->
        <!-- <v-icon
          class="point"
          small
          @click="editSocket = true"
        >
          mdi-pencil
        </v-icon> -->
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
          if (cleanedUrl.startsWith('http://')) {
            this.form.socketUrl = `ws://${url.hostname}:1337`;
          } else {
            this.form.socketUrl = `wss://${url.hostname}:1337`;
          }
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
    this.form.url = localStorage.getItem('loginUrl') || 'http://localhost:1337';
    this.form.username = localStorage.getItem('loginUsername') || '';
    this.rememberMe = localStorage.getItem('loginRememberMe') === 'true';
    this.$nextTick(() => {
      // this is in nextTick to allow us to write a saved socketUrl
      // after the 'form.url' watcher.
      const socketUrl = localStorage.getItem('socketUrl') || '';
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
      localStorage.setItem('loginRememberMe', this.rememberMe);

      if (this.rememberMe === true) {
        localStorage.setItem('loginUrl', cleanedUrl);
        localStorage.setItem('socketUrl', this.form.socketUrl);
        localStorage.setItem('loginUsername', this.form.username);
      } else {
        localStorage.removeItem('loginUrl');
        localStorage.removeItem('loginUsername');
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
