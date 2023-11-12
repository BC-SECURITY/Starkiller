<template>
  <div class="hello">
    <v-form class="inputs" @submit.prevent.native="submit">
      <v-text-field v-model="form.url" label="Url" dense outlined />
      <v-text-field v-model="form.username" label="Username" dense outlined />
      <v-text-field
        v-model="form.password"
        label="Password"
        :type="showPassword ? 'text' : 'password'"
        :append-icon="showPassword ? 'fa-eye' : 'fa-eye-slash'"
        outlined
        dense
        @click:append="showPassword = !showPassword"
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
  },
  watch: {
    loginError(val) {
      if (val.length > 0) {
        this.loading = false;
        this.$snack.error(`Error Logging In: ${val}`);
      }
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
