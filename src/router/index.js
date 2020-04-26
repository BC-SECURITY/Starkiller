import Vue from 'vue';
import VueRouter from 'vue-router';
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
    path: '/listeners/:id',
    name: 'listenerEdit',
    component: () => import(/* webpackChunkName: "listener-edit" */ '../views/ListenerEdit.vue'),
  },
  {
    path: '/listeners/new',
    name: 'listenerNew', // same component
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
    path: '/users',
    name: 'users',
    component: () => import(/* webpackChunkName: "users" */ '../views/Users.vue'),
  },
  {
    path: '/users/:id',
    name: 'userEdit',
    component: () => import(/* webpackChunkName: "user-edit" */ '../views/UserEdit.vue'),
  },
  {
    path: '/users/new',
    name: 'userNew',
    component: () => import(/* webpackChunkName: "user-edit" */ '../views/UserEdit.vue'),
  },
  {
    path: '/credentials',
    name: 'credentials',
    component: () => import(/* webpackChunkName: "credentials" */ '../views/Credentials.vue'),
  },
  {
    path: '/reporting',
    name: 'reporting',
    component: () => import(/* webpackChunkName: "reporting" */ '../views/Reporting.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import(/* webpackChunkName: "settings" */ '../views/Settings.vue'),
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
