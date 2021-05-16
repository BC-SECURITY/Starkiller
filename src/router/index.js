import Vue from 'vue';
import VueRouter from 'vue-router';
import store from '@/store/index';
import Home from '../views/Home.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
  },
  {
    path: '/listeners',
    name: 'listeners',
    component: () => import(/* webpackChunkName: "listeners" */ '../views/Listeners.vue'),
  },
  {
    path: '/listeners/new',
    name: 'listenerNew',
    component: () => import(/* webpackChunkName: "listener-edit" */ '../views/ListenerEdit.vue'),
  },
  {
    path: '/listeners/:id',
    name: 'listenerEdit',
    component: () => import(/* webpackChunkName: "listener-edit" */ '../views/ListenerEdit.vue'),
  },
  {
    path: '/stagers',
    name: 'stagers',
    component: () => import(/* webpackChunkName: "stagers" */ '../views/Stagers.vue'),
  },
  {
    path: '/stagers/new',
    name: 'stagerNew',
    component: () => import(/* webpackChunkName: "stager-edit" */ '../views/StagerEdit.vue'),
  },
  {
    path: '/stagers/:id',
    name: 'stagerEdit',
    component: () => import(/* webpackChunkName: "stager-edit" */ '../views/StagerEdit.vue'),
  },
  {
    path: '/agents',
    name: 'agents',
    component: () => import(/* webpackChunkName: "agents" */ '../views/Agents.vue'),
  },
  {
    path: '/agents/:id',
    name: 'agentEdit',
    component: () => import(/* webpackChunkName: "agent-edit" */ '../views/AgentEdit.vue'),
  },
  {
    path: '/modules',
    name: 'modules',
    component: () => import(/* webpackChunkName: "modules" */ '../views/Modules.vue'),
  },
  {
    path: '/modules/execute',
    name: 'moduleExecute',
    component: () => import(/* webpackChunkName: "modules" */ '../views/ModuleExecute.vue'),
  },
  {
    path: '/users',
    name: 'users',
    component: () => import(/* webpackChunkName: "users" */ '../views/Users.vue'),
  },
  {
    path: '/users/new',
    name: 'userNew',
    component: () => import(/* webpackChunkName: "user-edit" */ '../views/UserEdit.vue'),
    meta: {
      requiresAdmin: true,
    },
  },
  {
    path: '/users/:id',
    name: 'userEdit',
    component: () => import(/* webpackChunkName: "user-edit" */ '../views/UserEdit.vue'),
    meta: {
      requiresAdmin: true,
    },
  },
  {
    path: '/credentials',
    name: 'credentials',
    component: () => import(/* webpackChunkName: "credentials" */ '../views/Credentials.vue'),
  },
  {
    path: '/credentials/new',
    name: 'credentialNew',
    component: () => import(/* webpackChunkName: "credential-edit" */ '../views/CredentialEdit.vue'),
  },
  {
    path: '/credentials/:id',
    name: 'credentialEdit',
    component: () => import(/* webpackChunkName: "credential-edit" */ '../views/CredentialEdit.vue'),
  },
  {
    path: '/reporting',
    name: 'reporting',
    component: () => import(/* webpackChunkName: "reporting" */ '../views/Reporting.vue'),
  },
  {
    path: '/plugins',
    name: 'plugins',
    component: () => import(/* webpackChunkName: "plugins" */ '../views/Plugins.vue'),
  },
  {
    path: '/plugins/:id',
    name: 'pluginExecute',
    component: () => import(/* webpackChunkName: "plugin-execute" */ '../views/PluginExecute.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import(/* webpackChunkName: "settings" */ '../views/Settings.vue'),
  },
];

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes,
});

function isAuthenticated() {
  return store.getters['application/token'].length > 0;
}

function isAdmin() {
  return store.getters['application/isAdmin'] === true;
}

// Auth
router.beforeEach((to, from, next) => {
  if (to.name !== 'home' && !isAuthenticated()) {
    next({ name: 'home' });
  } else next();
});

// Admin
router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.requiresAdmin && !isAdmin()) {
    next(false);
  } else next();
});

export default router;
