<template>
  <div class="hello">
    <v-form class="inputs" @submit.prevent="submit">
      <v-text-field
        v-model="form.url"
        label="Url"
        density="compact"
        variant="outlined"
      />
      <v-text-field
        v-model="form.username"
        label="Username"
        density="compact"
        variant="outlined"
      />
      <v-text-field
        v-model="form.password"
        label="Password"
        :type="showPassword ? 'text' : 'password'"
        :append-inner-icon="showPassword ? 'fa-eye' : 'fa-eye-slash'"
        variant="outlined"
        density="compact"
        @click:append-inner="showPassword = !showPassword"
      />
      <v-checkbox v-model="rememberMe" label="Remember URL and Username" />
      <v-btn color="primary" type="submit" :loading="loading" rounded>
        Submit
      </v-btn>
    </v-form>
  </div>
</template>

<script>
import { useApplicationStore } from "@/stores/application-module";

export default {
  name: "Login",
  inject: ["snack"],
  data() {
    return {
      loading: false,
      showPassword: false,
      rememberMe: false,
      form: {
        url: "",
        username: "",
        password: "",
      },
    };
  },
  computed: {
    applicationStore() {
      return useApplicationStore();
    },
    isLoggedIn() {
      return this.applicationStore.isLoggedIn;
    },
    loginError() {
      return this.applicationStore.loginError;
    },
    forcedLogoutReason() {
      return this.applicationStore.forcedLogoutReason;
    },
  },
  watch: {
    loginError(val) {
      if (val.length > 0) {
        this.loading = false;
        this.snack.error(`Error Logging In: ${val}`);
      }
    },
    // immediate: true because the reason is set (by the 401/403
    // interceptor calling logout()) *before* the forced navigation to this
    // view -- by the time Login.vue mounts, the value is already sitting
    // in the store, so a non-immediate watcher would never see the change.
    forcedLogoutReason: {
      immediate: true,
      handler(val) {
        if (val) {
          this.snack.error(val);
        }
      },
    },
  },
  mounted() {
    this.form.url = localStorage.getItem("loginUrl") || "http://localhost:1337";
    this.form.username = localStorage.getItem("loginUsername") || "";
    this.rememberMe = localStorage.getItem("loginRememberMe") === "true";
  },
  methods: {
    submit() {
      const cleanedUrl =
        this.form.url.startsWith("http://") ||
        this.form.url.startsWith("https://")
          ? this.form.url
          : `http://${this.form.url}`;
      this.loading = true;
      localStorage.setItem("loginRememberMe", this.rememberMe);

      if (this.rememberMe === true) {
        localStorage.setItem("loginUrl", cleanedUrl);
        localStorage.setItem("loginUsername", this.form.username);
      } else {
        localStorage.removeItem("loginUrl");
        localStorage.removeItem("loginUsername");
      }

      const { host } = new URL(cleanedUrl);
      let socketUrl = "";
      if (cleanedUrl.startsWith("http://")) {
        socketUrl = `ws://${host}`;
      } else {
        socketUrl = `wss://${host}`;
      }

      this.applicationStore.login({
        url: cleanedUrl,
        socketUrl,
        username: this.form.username,
        password: this.form.password,
      });
    },
  },
};
</script>

<style scoped lang="scss"></style>
