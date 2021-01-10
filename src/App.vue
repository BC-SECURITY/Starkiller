<template>
  <div id="app">
    <v-app :dark="isDarkMode">
      <side-nav
        v-if="isLoggedIn && !hideSideBar"
      />
      <confirm ref="confirm" />
      <socket-notifications v-if="isLoggedIn && versionSatisfies('>=3.5.0') && !hideSideBar" />

      <!-- Sizes your content based upon application components -->
      <v-main>
        <!-- Provides the application the proper gutter -->
        <v-container fluid>
          <!-- If using vue-router -->
          <router-view :class="hideSideBar ? '' : 'ml-8'" />
        </v-container>
      </v-main>

      <v-footer
        v-if="!hideSideBar"
        app
      >
        <span class="mr-2">Copyright (c) 2020 BC Security |</span>
        <a
          class="mr-2"
          target="_blank"
          href="https://github.com/bc-security/starkiller"
          @click.prevent="openExternalBrowser"
        > Starkiller </a>
        <span class="mr-2">|</span>
        <a
          class="mr-2"
          target="_blank"
          href="https://github.com/bc-security/empire"
          @click.prevent="openExternalBrowser"
        > Empire</a>
        <span class="mr-2">|</span>
        <a
          class="mr-2"
          target="_blank"
          href="https://github.com/sponsors/BC-SECURITY"
          @click.prevent="openExternalBrowser"
        > Sponsor for extra features</a>
      </v-footer>
    </v-app>
  </div>
</template>
<script>
import semver from 'semver';
import { mapGetters, mapState } from 'vuex';
import openExternalBrowser from '@/mixins/open-external';

import SideNav from '@/components/SideNav.vue';
import Confirm from '@/components/Confirm.vue';
import SocketNotifications from '@/components/SocketNotifications.vue';

export default {
  name: 'App',
  components: {
    SideNav,
    Confirm,
    SocketNotifications,
  },
  mixins: [openExternalBrowser],
  computed: {
    ...mapGetters({
      isLoggedIn: 'application/isLoggedIn',
      isDarkMode: 'application/isDarkMode',
    }),
    ...mapState({
      empireVersion: state => state.application.empireVersion,
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
      handler(val) {
        if (val.length > 0) {
          if (!semver.satisfies(val.split(' ')[0], '>=3.5.0')) {
            this.$toast.error(
              'Starkiller 1.4.x is recommended to be used with Empire 3.5.0 or greater.'
              + ' Some features may not work properly.',
              { timeout: 8000 },
            );
          }
        }
      },
      immediate: true,
    },
  },
  mounted() {
    this.$root.$confirm = this.$refs.confirm.open;
    if (this.isLoggedIn === false && !this.isLoginPage) {
      this.$router.push({ name: 'home' });
    } else if (this.isLoggedIn === true && this.$route.name === 'home') {
      this.$router.push({ name: 'listeners' });
    }
  },
  methods: {
    versionSatisfies(version) {
      return semver.satisfies(this.empireVersion.split(' ')[0], version);
    },
  },
};
</script>
<style lang="scss">
@import 'app.scss';

@import '../node_modules/@fortawesome/fontawesome-free/css/all.css';
@import '../node_modules/typeface-roboto/index.css';

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
