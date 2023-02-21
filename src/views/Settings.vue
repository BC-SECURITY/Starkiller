<template>
  <div>
    <list-page-top
      :breads="breads"
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
      <div style="display: flex; flex-direction: row;">
        <v-switch
          v-model="darkModeSwitch"
          :label="`Dark Mode`"
        />
        <v-switch
          v-model="chatWidgetSwitch"
          class="pl-8"
          :label="`Chat Widget`"
        />
      </div>
      <v-divider />
      <div class="headers pl-0 mt-2">
        <h4>Update Password</h4>
      </div>
      <v-form
        ref="form"
        v-model="valid"
        style="max-width: 500px"
        @submit.prevent.native="submit"
      >
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
        <v-btn
          type="submit"
          class="mt-4 mb-4 primary"
          :loading="loading"
        >
          submit
        </v-btn>
      </v-form>
      <v-divider />
      <div class="headers pl-0 mt-2">
        <div>
          <h4> Clear Application State </h4>
          <span> This will clear UI preferences and other localstorage data.</span>
        </div>
        <v-btn
          color="error"
          @click="clearState"
        >
          Clear
        </v-btn>
      </div>
      <v-divider />
    </div>
  </div>
</template>

<script>
import * as userApi from '@/api/user-api';
import { mapState } from 'vuex';
import ListPageTop from '@/components/ListPageTop.vue';

export default {
  components: {
    ListPageTop,
  },
  data() {
    return {
      form: {},
      rules: {
        password: [
          (v) => !!v || 'Password is required',
          (v) => (!!v && v.length > 5) || 'Password must be larger than 5 characters',
        ],
        confirmPassword: [
          (v) => !!v || 'Confirmation is required',
          (v) => v === this.form.password || 'Password must match',
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
      user: (state) => state.application.user,
      darkMode: (state) => state.application.darkMode,
      chatWidget: (state) => state.application.chatWidget,
    }),
    userId() {
      return this.user.id;
    },
    darkModeSwitch: {
      set(val) {
        this.$store.dispatch('application/darkMode', val);
      },
      get() {
        return this.darkMode;
      },
    },
    chatWidgetSwitch: {
      set(val) {
        this.$store.dispatch('application/chatWidget', val);
      },
      get() {
        return this.chatWidget;
      },
    },
  },
  methods: {
    async logout() {
      if (await this.$root.$confirm('', 'Are you sure you want to logout?', { color: 'green' })) {
        this.$store.dispatch('application/logout');
      }
    },
    clearState() {
      this.$store.dispatch('application/clear');
    },
    submit() {
      if (this.loading || !this.$refs.form.validate()) {
        return;
      }

      this.loading = true;
      userApi.updatePassword(this.user.id, this.form.password)
        .then(() => {
          this.$snack.success('Password updated');
          this.form = {};
          this.$refs.form.resetValidation();
          this.loading = false;
        })
        .catch((err) => {
          this.$snack.error(`Error: ${err}`);
          this.loading = false;
        });
    },
  },
};
</script>

<style>
.point:hover {
  cursor: pointer;
}
</style>
