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
          v-model="password.form.password"
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
          v-model="password.form.confirmPassword"
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
          :loading="password.loading"
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
      <div class="headers pl-0 mt-2">
        <div>
          <h4>Reload Malleable Profiles</h4>
          <span>
            Reload will check for and load new profile configurations.<br>
            Reset will do the same but also reset all database records to defaults.
          </span>
        </div>
        <div class="d-flex justify-end">
          <v-btn
            :loading="profiles.loading"
            color="primary"
            class="ml-2 mr-2"
            @click="reloadProfiles"
          >
            Reload
          </v-btn>
          <v-btn
            :loading="profiles.loading"
            color="error"
            class="ml-2"
            @click="resetProfiles"
          >
            Reset to Defaults
          </v-btn>
        </div>
      </div>
      <v-divider />
      <div class="headers pl-0 mt-2">
        <div>
          <h4>Reload Modules</h4>
          <span>
            Reload will check for and load new module configurations.<br>
            Reset will do the same but also reset all database records to defaults.
          </span>
        </div>
        <div class="d-flex justify-end">
          <v-btn
            :loading="modules.loading"
            color="primary"
            class="ml-2 mr-2"
            @click="reloadModules"
          >
            Reload
          </v-btn>
          <v-btn
            :loading="modules.loading"
            color="error"
            class="ml-2"
            @click="resetModules"
          >
            Reset to Defaults
          </v-btn>
        </div>
      </div>
      <v-divider />
      <div class="headers pl-0 mt-2">
        <div>
          <h4>Reload Bypasses</h4>
          <span>
            Reload will check for and load new bypass configurations.<br>
            Reset will do the same but also reset all database records to defaults.
          </span>
        </div>
        <div class="d-flex justify-end">
          <v-btn
            :loading="bypasses.loading"
            color="primary"
            class="ml-2 mr-2"
            @click="reloadBypasses"
          >
            Reload
          </v-btn>
          <v-btn
            :loading="bypasses.loading"
            color="error"
            class="ml-2"
            @click="resetBypasses"
          >
            Reset to Defaults
          </v-btn>
        </div>
      </div>
      <v-divider />
      <div class="headers pl-0 mt-2">
        <div>
          <h4>Reload Plugins</h4>
          <span>Reload will check for and load new plugins.</span>
        </div>
        <v-btn
          :loading="plugins.loading"
          color="error"
          @click="reloadPlugins"
        >
          Reload
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import * as bypassApi from '@/api/bypass-api';
import * as moduleApi from '@/api/module-api';
import * as malleableApi from '@/api/malleable-api';
import * as pluginApi from '@/api/plugin-api';
import * as userApi from '@/api/user-api';
import { mapState } from 'vuex';
import ListPageTop from '@/components/ListPageTop.vue';

export default {
  components: {
    ListPageTop,
  },
  data() {
    return {
      password: {
        form: {},
        loading: false,
      },
      rules: {
        password: [
          (v) => !!v || 'Password is required',
          (v) => (!!v && v.length > 5) || 'Password must be larger than 5 characters',
        ],
        confirmPassword: [
          (v) => !!v || 'Confirmation is required',
          (v) => v === this.password.form.password || 'Password must match',
        ],
      },
      modules: {
        loading: false,
      },
      bypasses: {
        loading: false,
      },
      profiles: {
        loading: false,
      },
      plugins: {
        loading: false,
      },
      showPassword: false,
      showConfirm: false,
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
      if (this.password.loading || !this.$refs.form.validate()) {
        return;
      }

      this.password.loading = true;
      userApi.updatePassword(this.user.id, this.password.form.password)
        .then(() => {
          this.$snack.success('Password updated');
          this.password.form = {};
          this.$refs.form.resetValidation();
        })
        .catch((err) => {
          this.$snack.error(`Error: ${err}`);
        })
        .finally(() => {
          this.password.loading = false;
        });
    },
    resetProfiles() {
      this.profiles.loading = true;
      malleableApi.resetProfiles()
        .then(() => {
          this.$snack.success('Profiles reset successful');
        })
        .catch((err) => {
          this.$snack.error(`Error: ${err}`);
        })
        .finally(() => {
          this.profiles.loading = false;
        });
    },
    reloadProfiles() {
      this.profiles.loading = true;
      malleableApi.reloadProfiles()
        .then(() => {
          this.$snack.success('Profiles reload successful');
        })
        .catch((err) => {
          this.$snack.error(`Error: ${err}`);
        })
        .finally(() => {
          this.profiles.loading = false;
        });
    },
    reloadModules() {
      this.modules.loading = true;
      moduleApi.reloadModules()
        .then(() => {
          this.$snack.success('Module reload successful');
        })
        .catch((err) => {
          this.$snack.error(`Error: ${err}`);
        })
        .finally(() => {
          this.modules.loading = false;
        });
    },
    resetModules() {
      this.modules.loading = true;
      moduleApi.resetModules()
        .then(() => {
          this.$snack.success('Module reset successful');
        })
        .catch((err) => {
          this.$snack.error(`Error: ${err}`);
        })
        .finally(() => {
          this.modules.loading = false;
        });
    },
    reloadBypasses() {
      this.bypasses.loading = true;
      bypassApi.reloadBypasses()
        .then(() => {
          this.$snack.success('Bypass reload successful');
        })
        .catch((err) => {
          this.$snack.error(`Error: ${err}`);
        })
        .finally(() => {
          this.bypasses.loading = false;
        });
    },
    resetBypasses() {
      this.bypasses.loading = true;
      bypassApi.resetBypasses()
        .then(() => {
          this.$snack.success('Bypass reset successful');
        })
        .catch((err) => {
          this.$snack.error(`Error: ${err}`);
        })
        .finally(() => {
          this.bypasses.loading = false;
        });
    },
    reloadPlugins() {
      this.plugins.loading = true;
      pluginApi.reloadPlugins()
        .then(() => {
          this.$snack.success('Plugin reload successful');
        })
        .catch((err) => {
          this.$snack.error(`Error: ${err}`);
        })
        .finally(() => {
          this.plugins.loading = false;
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
