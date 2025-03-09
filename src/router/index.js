import Vue from "vue";
import VueRouter from "vue-router";
import { useApplicationStore } from "@/stores/application-module";
import Home from "../views/Home.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "home",
    component: Home,
  },
  {
    path: "/about",
    name: "about",
    component: () => import("../views/About.vue"),
  },
  {
    path: "/notifications",
    name: "notifications",
    component: () => import("../views/Notifications.vue"),
  },
  {
    path: "/listeners",
    name: "listeners",
    component: () => import("../components/listeners/ListenersList.vue"),
  },
  {
    path: "/malleable-profiles",
    name: "malleableProfiles",
    component: () =>
      import("../components/listeners/MalleableProfilesList.vue"),
  },
  {
    path: "/listeners/new",
    name: "listenerNew",
    component: () => import("../views/ListenerEdit.vue"),
  },
  {
    path: "/listeners/:id",
    name: "listenerEdit",
    component: () => import("../views/ListenerEdit.vue"),
  },
  {
    path: "/stagers",
    name: "stagers",
    component: () => import("../views/Stagers.vue"),
  },
  {
    path: "/stagers/new",
    name: "stagerNew",
    component: () => import("../views/StagerEdit.vue"),
  },
  {
    path: "/stagers/:id",
    name: "stagerEdit",
    component: () => import("../views/StagerEdit.vue"),
  },
  {
    path: "/agents",
    name: "agents",
    component: () => import("../components/agents/AgentsList.vue"),
  },
  {
    path: "/agent-tasks",
    name: "agentTasks",
    component: () => import("../components/agents/AgentTasksList.vue"),
  },
  {
    path: "/agents/:id",
    name: "agentEdit",
    component: () => import("../views/AgentEdit.vue"),
  },
  {
    path: "/modules",
    name: "modules",
    component: () => import("../views/Modules.vue"),
  },
  {
    path: "/modules/:id",
    name: "moduleExecute",
    component: () => import("../views/ModuleExecute.vue"),
  },
  {
    path: "/users",
    name: "users",
    component: () => import("../views/Users.vue"),
  },
  {
    path: "/users/new",
    name: "userNew",
    component: () => import("../views/UserEdit.vue"),
    meta: {
      requiresAdmin: true,
    },
  },
  {
    path: "/users/:id",
    name: "userEdit",
    component: () => import("../views/UserEdit.vue"),
    meta: {
      requiresAdmin: true,
    },
  },
  {
    path: "/credentials",
    name: "credentials",
    component: () => import("../views/Credentials.vue"),
  },
  {
    path: "/credentials/new",
    name: "credentialNew",
    component: () => import("../views/CredentialEdit.vue"),
  },
  {
    path: "/credentials/:id",
    name: "credentialEdit",
    component: () => import("../views/CredentialEdit.vue"),
  },
  {
    path: "/malleable-profiles/new",
    name: "malleableProfileNew",
    component: () => import("../views/MalleableProfileEdit.vue"),
  },
  {
    path: "/malleable-profiles/:id",
    name: "malleableProfileEdit",
    component: () => import("../views/MalleableProfileEdit.vue"),
  },
  {
    path: "/bypasses",
    name: "bypasses",
    component: () => import("../views/Bypasses.vue"),
  },
  {
    path: "/bypasses/new",
    name: "bypassNew",
    component: () => import("../views/BypassEdit.vue"),
  },
  {
    path: "/bypasses/:id",
    name: "bypassEdit",
    component: () => import("../views/BypassEdit.vue"),
  },
  {
    path: "/downloads",
    name: "downloads",
    component: () => import("../views/Downloads.vue"),
  },
  {
    path: "/plugins",
    name: "plugins",
    component: () => import("../components/plugins/PluginsList.vue"),
  },
  {
    path: "/plugin-tasks",
    name: "pluginTasks",
    component: () => import("../components/plugins/PluginTasksList.vue"),
  },
  {
    path: "/plugin-marketplace",
    name: "pluginMarketplace",
    component: () => import("../components/plugins/PluginMarketplace.vue"),
  },
  {
    path: "/plugins/:id",
    name: "pluginEdit",
    component: () => import("../views/PluginEdit.vue"),
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("../views/Settings.vue"),
  },
  {
    path: "/obfuscation",
    name: "obfuscation",
    component: () => import("../views/Obfuscation.vue"),
  },
];

const router = new VueRouter({
  mode: "hash",
  base: import.meta.env.BASE_URL,
  routes,
});

function isAuthenticated() {
  return useApplicationStore().token.length > 0;
}

function isAdmin() {
  return useApplicationStore().isAdmin;
}

// Auth
router.beforeEach((to, from, next) => {
  if (to.name !== "home" && !isAuthenticated()) {
    next({ name: "home" });
  } else next();
});

// Admin
router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.requiresAdmin && !isAdmin()) {
    next(false);
  } else next();
});

export default router;
