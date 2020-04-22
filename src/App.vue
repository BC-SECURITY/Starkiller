<template>
  <div id="app">
    <v-app :dark="isDarkMode">
      <side-nav v-if="isLoggedIn" />

      <!-- Sizes your content based upon application components -->
      <v-content>
        <!-- Provides the application the proper gutter -->
        <v-container fluid>
          <!-- If using vue-router -->
          <router-view />
        </v-container>
      </v-content>

      <v-footer app>
        Copyright Me
      </v-footer>
    </v-app>
  </div>
</template>
<script>
import semver from 'semver';
import { mapGetters, mapState } from 'vuex';
import SideNav from '@/components/SideNav.vue';

export default {
  name: 'App',
  components: {
    SideNav,
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
      return this.$route.path === '/';
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
      if (val === false) {
        this.$router.push({ path: '/' });
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
    if (this.isLoggedIn === false) {
      this.$router.push({ path: '/' });
    }
  },
};
</script>
<style lang="scss">
@import 'app.scss';

// #app {
//   font-family: 'Avenir', Helvetica, Arial, sans-serif;
//   -webkit-font-smoothing: antialiased;
//   -moz-osx-font-smoothing: grayscale;
//   text-align: center;
//   color: #2c3e50;

//   // display: flex;
//   // flex-direction: row;
// }

// #router-view {
//   // display: flex;
//   // flex-direction: column;
//   // overflow-x: auto;
// }

// .nav {
//   padding: 10px 30px 0px 30px;

//   a {
//     font-weight: bold;
//     color: #2c3e50;

//     &.router-link-exact-active {
//       color: #42b983;
//     }
//   }
// }
</style>
