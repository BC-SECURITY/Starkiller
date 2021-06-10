<template>
  <div id="app">
    <v-app :dark="isDarkMode">
      <side-nav
        v-if="isLoggedIn && !hideSideBar"
      />
      <confirm ref="confirm" />
      <socket-notifications v-if="isLoggedIn && versionSatisfies('>=4.0') && !hideSideBar" />
      <starkiller-snackbar ref="snack" />
      <v-app-bar
        v-if="isLoggedIn"
        elevate-on-scroll
        app
      >
        <template
          v-if="$route.name === 'agentEdit'"
          #extension
        >
          <portal-target
            name="app-bar-extension"
            slim
          />
        </template>
        <portal-target
          name="app-bar"
          multiple
          slim
        />
      </v-app-bar>
      <!-- Sizes your content based upon application components -->
      <v-main>
        <!-- Provides the application the proper gutter -->
        <v-container fluid>
          <!-- If using vue-router -->
          <router-view />
        </v-container>
      </v-main>

      <v-footer
        v-if="!hideSideBar"
        app
      >
        <span class="mr-2">Copyright (c) 2021 BC Security |</span>
        <a
          class="mr-2"
          target="_blank"
          href="https://github.com/bc-security/starkiller"
        > Starkiller </a>
        <span class="mr-2">|</span>
        <a
          class="mr-2"
          target="_blank"
          href="https://github.com/bc-security/empire"
        > Empire</a>
        <span class="mr-2">|</span>
        <a
          class="mr-2"
          target="_blank"
          href="https://github.com/sponsors/BC-SECURITY"
        > Sponsor for extra features</a>
      </v-footer>
    </v-app>
  </div>
</template>
<script>
import Vue from 'vue';
import semver from 'semver';
import { mapGetters, mapState } from 'vuex';

import SideNav from '@/components/SideNav.vue';
import Confirm from '@/components/Confirm.vue';
import SocketNotifications from '@/components/SocketNotifications.vue';
import StarkillerSnackbar from '@/components/StarkillerSnackbar.vue';

export default {
  name: 'App',
  components: {
    SideNav,
    Confirm,
    SocketNotifications,
    StarkillerSnackbar,
  },
  computed: {
    ...mapGetters({
      isLoggedIn: 'application/isLoggedIn',
      isDarkMode: 'application/isDarkMode',
    }),
    ...mapState({
      empireVersion: (state) => state.application.empireVersion,
      connectionError: (state) => state.application.connectionError,
    }),
    isLoginPage() {
      return this.$route.name === 'home';
    },
    hideSideBar() {
      return this.$route.query.hideSideBar;
    },
  },
  watch: {
    isDarkMode: {
      immediate: true,
      handler(val) {
        if (val === true) {
          this.$vuetify.theme.dark = true;
        } else {
          this.$vuetify.theme.dark = false;
        }
      },
    },
    isLoggedIn(val) {
      if (val === false && !this.isLoginPage) {
        this.$router.push({ name: 'home' });
      } else if (val === true && this.$route.name !== 'listeners') {
        this.$router.push({ name: 'listeners' });
      }
    },
    empireVersion: {
      async handler(val) {
        if (val.length > 0) {
          if (semver.satisfies(val.split(' ')[0].split('-')[0], '<4.0')) {
            await this.$nextTick();
            this.$snack.warn(
              'Starkiller 1.8.x is recommended to be used with Empire 4.0 or greater.'
              + ' Some features may not work properly.',
            );
          }
        }
      },
      immediate: true,
    },
    connectionError(val) {
      if (val > 0) {
        this.$snack.error('Could not reach Empire server');
      }
    },
  },
  mounted() {
    this.$root.$confirm = this.$refs.confirm.open;
    if (this.isLoggedIn === false && !this.isLoginPage) {
      this.$router.push({ name: 'home' });
    } else if (this.isLoggedIn === true && this.$route.name === 'home') {
      this.$router.push({ name: 'listeners' });
    }

    // register global snackbar
    Vue.prototype.$snack = this.$refs.snack;
  },
  methods: {
    versionSatisfies(version) {
      return semver.satisfies(this.empireVersion.split(' ')[0].split('-')[0], version);
    },
  },
};
</script>
<style lang="scss">
@import 'app.scss';

@import '../node_modules/@fortawesome/fontawesome-free/css/all.css';

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
