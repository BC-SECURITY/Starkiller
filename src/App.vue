<template>
  <div id="app">
    <v-app :dark="isDarkMode">
      <side-nav v-if="isLoggedIn" />
      <confirm ref="confirm" />

      <!-- socket notifications -->
      <v-snackbar
        v-model="socketNotification.enabled"
        absolute
        right
        top
      >
        {{ socketNotification.text }}

        <template v-slot:action="{ attrs }">
          <v-btn
            color="orange darken-2"
            text
            v-bind="attrs"
            @click="goToRoute"
          >
            View
          </v-btn>
        </template>
      </v-snackbar>

      <!-- Sizes your content based upon application components -->
      <v-main>
        <!-- Provides the application the proper gutter -->
        <v-container fluid>
          <!-- If using vue-router -->
          <router-view />
        </v-container>
      </v-main>

      <v-footer app>
        <span class="mr-2">Copyright (c) 2020 BC Security |</span>
        <a
          class="mr-2"
          target="_blank"
          href="https://github.com/bc-security/starkiller"
          @click.prevent="openExternalBrowser"
        > Starkiller </a>
        <span class="mr-2">|</span>
        <a
          target="_blank"
          href="https://github.com/bc-security/empire"
          @click.prevent="openExternalBrowser"
        > Empire</a>
      </v-footer>
    </v-app>
  </div>
</template>
<script>
import io from 'socket.io-client';

import semver from 'semver';
import { mapGetters, mapState } from 'vuex';
import openExternalBrowser from '@/mixins/open-external';

import SideNav from '@/components/SideNav.vue';
import Confirm from '@/components/Confirm.vue';

export default {
  name: 'App',
  components: {
    SideNav,
    Confirm,
  },
  mixins: [openExternalBrowser],
  data() {
    return {
      socketNotification: {
        enabled: false,
        text: '',
        route: '',
        id: '',
      },
    };
  },
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
          if (!semver.satisfies(val.split(' ')[0], '>=3.3.0')) {
            this.$toast.error(
              'Starkiller 1.3.x is recommended to be used with Empire 3.3.0 or greater.'
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
    this.socket = io('ws://localhost:5000');
    window.socket = this.socket;
    this.socket.on('listeners/new', (data) => {
      this.socketNotification = {
        id: data.name,
        route: 'listenerEdit',
        enabled: true,
        text: `New Listener '${data.name}' started!`,
      };
    });
    this.socket.on('agents/new', (data) => {
      this.socketNotification = {
        id: data.sessionID,
        route: 'agentEdit',
        enabled: true,
        text: `New Agent '${data.sessionID}' callback!`,
      };
    });
    // this.socket.on('credentials/new')
    // this.socket.on('listeners', (data) => {
    //   this.$toast.success(data);
    // });
    this.socket.on('Users', (data) => {
      this.$toast.success(data);
    });
    if (this.isLoggedIn === false && !this.isLoginPage) {
      this.$router.push({ name: 'home' });
    } else if (this.isLoggedIn === true && this.$route.name === 'home') {
      this.$router.push({ name: 'listeners' });
    }
  },
  methods: {
    goToRoute() {
      this.$router.push({
        name: this.socketNotification.route,
        params: { id: this.socketNotification.id },
      });
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
