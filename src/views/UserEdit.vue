<template>
  <div>
    <edit-page-top
      :breads="breads"
      :show-submit="true"
      :show-copy="false"
      :show-delete="false"
      :submit-loading="loading"
      @submit="submit"
    />
    <h3>{{ id ? "Edit" : "New" }} User</h3>
    <error-state-alert
      v-if="errorState"
      :resource-id="id"
      resource-type="user"
    />
    <v-card v-else style="padding: 10px">
      <v-form
        ref="form"
        v-model="valid"
        style="max-width: 500px"
        @submit.prevent="submit"
      >
        <v-text-field
          v-model="form.username"
          :rules="rules['name']"
          label="Username"
          variant="outlined"
          density="compact"
          required
          :disabled="!isNew"
        />
        <v-text-field
          v-if="isNew"
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          :append-inner-icon="showPassword ? 'fa-eye' : 'fa-eye-slash'"
          :rules="rules['password']"
          label="Password"
          autocomplete="off"
          variant="outlined"
          density="compact"
          required
          @click:append-inner="showPassword = !showPassword"
        />
        <v-text-field
          v-if="isNew"
          v-model="form.confirm_password"
          :type="showConfirm ? 'text' : 'password'"
          :append-inner-icon="showConfirm ? 'fa-eye' : 'fa-eye-slash'"
          :rules="rules['confirmPassword']"
          label="Confirm Password"
          autocomplete="off"
          variant="outlined"
          density="compact"
          required
          @click:append-inner="showConfirm = !showConfirm"
        />
        <v-switch
          v-if="isAdmin"
          v-model="form.is_admin"
          color="primary"
          label="Admin"
        />
        <v-switch
          v-if="!isNew"
          v-model="form.enabled"
          color="primary"
          label="Enabled"
        />
      </v-form>
    </v-card>
  </div>
</template>

<script>
import { mapState } from "pinia";
import * as userApi from "@/api/user-api";
import ErrorStateAlert from "@/components/ErrorStateAlert.vue";
import EditPageTop from "@/components/EditPageTop.vue";
import { useApplicationStore } from "@/stores/application-module";

export default {
  name: "UserEdit",
  components: {
    ErrorStateAlert,
    EditPageTop,
  },
  inject: ["snack"],
  data() {
    return {
      form: {
        username: "",
        password: "",
        confirm_password: "",
        is_admin: false,
      },
      rules: {
        name: [
          (v) => !!v || "Name is required",
          (v) =>
            (!!v && v.length > 3) || "Name must be larger than 3 characters",
        ],
        password: [
          (v) => !!v || "Password is required",
          (v) =>
            (!!v && v.length > 5) ||
            "Password must be larger than 5 characters",
        ],
        confirmPassword: [
          (v) => !!v || "Confirmation is required",
          (v) => v === this.form.password || "Password must match",
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
    ...mapState(useApplicationStore, ["isAdmin"]),
    breads() {
      return [
        {
          title: "Users",
          disabled: false,
          to: "/users",
          exact: true,
        },
        {
          title: this.breadcrumbName,
          disabled: true,
          to: "/users-edit",
        },
      ];
    },
    breadcrumbName() {
      if (this.user.username) return this.user.username;
      if (this.id) return this.id;
      return "New";
    },
    isNew() {
      return this.$route.name === "userNew";
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
      if (this.loading) return;
      const { valid } = await this.$refs.form.validate();
      if (!valid) return;

      this.loading = true;
      if (this.id > 0) {
        userApi
          .updateUser(this.form)
          .then(() => {
            this.snack.success("User updated");
            this.loading = false;
          })
          .catch((err) => {
            this.snack.error(`Error: ${err}`);
            this.loading = false;
          });
      } else {
        userApi
          .createUser(this.form)
          .then(({ id }) => {
            this.snack.success("User created");
            this.loading = false;
            this.$router.push({ name: "userEdit", params: { id } });
          })
          .catch((err) => {
            this.snack.error(`Error: ${err}`);
            this.loading = false;
          });
      }
    },
    getUser(id) {
      userApi
        .getUser(id)
        .then((data) => {
          this.user = data;
          this.form = data;
        })
        .catch((err) => {
          console.error(err);
          this.snack.error(`Failed to load resource: ${err}`);
          this.errorState = true;
        });
    },
  },
};
</script>

<style></style>
