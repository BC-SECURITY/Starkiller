<template>
  <div id="app">
    <v-app :dark="isDarkMode">
      <side-nav v-if="isLoggedIn" />
      <confirm ref="confirm" />

      <!-- Sizes your content based upon application components -->
      <v-content>
        <!-- Provides the application the proper gutter -->
        <v-container fluid>
          <!-- If using vue-router -->
          <router-view />
        </v-container>
      </v-content>

      <v-footer app>
        <span class="mr-2">Copyright (c) 2020 BC Security |</span>
        <a
          class="mr-2"
          target="_blank"
          href="https://github.com/bc-security/starkiller"
          @click.prevent="openExternalBrowser"
        > Starkiller |</a>
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
// eslint-disable-next-line import/no-extraneous-dependencies
import { remote } from 'electron';
import semver from 'semver';
import { mapGetters, mapState } from 'vuex';
import SideNav from '@/components/SideNav.vue';
import Confirm from '@/components/Confirm.vue';

export default {
  name: 'App',
  components: {
    SideNav,
    Confirm,
  },
  computed: {
    ...mapGetters({
      isLoggedIn: 'profile/isLoggedIn',
      isDarkMode: 'profile/isDarkMode',
    }),
    ...mapState({
      empireVersion: state => state.profile.empireVersion,
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
    empireVersion(val) {
      if (val.length > 0) {
        if (!semver.satisfies(val.split(' ')[0], '>=3.1.5')) {
          this.$alert(
            'Starkiller 1.1.x is recommended to be used with Empire 3.1.5 or greater.'
            + ' You may continue, but some features may not work properly.',
            'Incompatabile Empire Version',
          );
        }
      }
    },
  },
  mounted() {
    this.$root.$confirm = this.$refs.confirm.open;

    if (this.isLoggedIn === false && !this.isLoginPage) {
      this.$router.push({ name: 'home' });
    } else if (this.isLoggedIn === true && this.$route.name !== 'listeners') {
      this.$router.push({ name: 'listeners' });
    }
  },
  methods: {
    openExternalBrowser(e) {
      remote.shell.openExternal(e.target.href);
    },
  },
};
</script>
<style lang="scss">
@import 'app.scss';

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
