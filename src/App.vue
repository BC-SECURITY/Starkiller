<template>
  <div id="app">
    <v-app>
      <side-nav v-if="isLoggedIn && !hideSideBar" />
      <confirm ref="confirm" />
      <socket-notifications
        v-if="isLoggedIn && versionSatisfies('>=4.0') && !hideSideBar"
        ref="socketNotifications"
      />
      <starkiller-snackbar ref="snack" />
      <v-app-bar v-if="isLoggedIn" scroll-behavior="elevate">
        <template
          v-if="
            $route.name === 'agentEdit' ||
            $route.name === 'pluginEdit' ||
            $route.name === 'listenerEdit'
          "
          #extension
        >
          <div
            id="app-bar-extension"
            style="display: flex; flex: 1 1 auto; align-items: center"
          ></div>
        </template>
        <div
          id="app-bar"
          style="display: flex; flex: 1 1 auto; align-items: center"
        ></div>
        <div v-if="isLoggedIn && chatWidget" class="pt-2">
          <v-btn icon variant="text" size="small" @click="openChat">
            <v-badge
              :content="chatUnreadCount"
              :model-value="chatUnreadCount > 0"
              color="#F37C22"
            >
              <v-icon>mdi-chat</v-icon>
            </v-badge>
          </v-btn>
        </div>
        <notification-bell
          v-show="$route.name !== 'notifications'"
          ref="bell"
        />
      </v-app-bar>
      <v-main>
        <v-container fluid>
          <router-view />
        </v-container>
      </v-main>

      <v-footer v-if="!hideSideBar" app>
        <span class="mr-2">Copyright (c) 2023 BC Security |</span>
        <a
          class="mr-2"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/bc-security/starkiller"
        >
          Starkiller
        </a>
        <span class="mr-2">|</span>
        <a
          class="mr-2"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/bc-security/empire"
        >
          Empire</a
        >
        <span class="mr-2">|</span>
        <a
          class="mr-2"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/sponsors/BC-SECURITY"
        >
          Sponsor for extra features</a
        >
      </v-footer>
    </v-app>
  </div>
</template>
<script>
import semver from "semver";
import { mapState } from "pinia";

import SideNav from "@/components/SideNav.vue";
import Confirm from "@/components/Confirm.vue";
import SocketNotifications from "@/components/SocketNotifications.vue";
import StarkillerSnackbar from "@/components/StarkillerSnackbar.vue";
import NotificationBell from "@/components/NotificationBell.vue";
import { useApplicationStore } from "@/stores/application-module";

export default {
  name: "App",
  components: {
    NotificationBell,
    SideNav,
    Confirm,
    SocketNotifications,
    StarkillerSnackbar,
  },
  provide() {
    return {
      snack: this.snackProxy,
      bell: this.bellProxy,
      confirm: (...args) => {
        if (!this.$refs.confirm) {
          console.warn("[Starkiller] confirm ref unavailable:", ...args);
          return false;
        }
        return this.$refs.confirm.open(...args);
      },
    };
  },
  data() {
    const createRefProxy = (refName, methods) =>
      Object.fromEntries(
        methods.map((method) => [
          method,
          (...args) => {
            if (!this.$refs[refName]) {
              console.error(
                `[Starkiller] ${refName} ref unavailable, ${method}:`,
                ...args,
              );
              return;
            }
            this.$refs[refName][method](...args);
          },
        ]),
      );

    return {
      snackProxy: createRefProxy("snack", ["error", "warn", "success", "info"]),
      bellProxy: createRefProxy("bell", ["push"]),
    };
  },
  computed: {
    ...mapState(useApplicationStore, [
      "isLoggedIn",
      "empireVersion",
      "connectionError",
      "chatWidget",
      "chatUnreadCount",
    ]),
    isLoginPage() {
      return this.$route.name === "home";
    },
    hideSideBar() {
      return this.$route.query.hideSideBar;
    },
  },
  watch: {
    isLoginPage: {
      immediate: true,
      handler(val) {
        if (val === true && this.isLoggedIn === true) {
          this.$router.push({ name: "listeners" });
        } else if (val === false && this.isLoggedIn === false) {
          this.$router.push({ name: "home" });
        }
      },
    },
    isLoggedIn(val) {
      if (val === false && !this.isLoginPage) {
        this.$router.push({ name: "home" });
      } else if (val === true && this.$route.name !== "listeners") {
        this.$router.push({ name: "listeners" });
      }
    },
    empireVersion: {
      async handler(val) {
        if (val.length > 0) {
          if (semver.satisfies(val.split(" ")[0].split("-")[0], "<5.2")) {
            await this.$nextTick();
            this.snackProxy.warn(
              "This version of Starkiller is recommended to be used with Empire 5.2 or greater." +
                " Some features may not work properly.",
            );
          }
        }
      },
      immediate: true,
    },
    connectionError(val) {
      if (val > 0) {
        this.snackProxy.error("Could not reach Empire server");
      }
    },
  },
  methods: {
    openChat() {
      this.$refs.socketNotifications?.$refs.chat?.open();
    },
    versionSatisfies(version) {
      return semver.satisfies(
        this.empireVersion.split(" ")[0].split("-")[0],
        version,
      );
    },
  },
};
</script>
<style lang="scss">
@import "app.scss";

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
