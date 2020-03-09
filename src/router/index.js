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
    path: '/stagers',
    name: 'stagers',
    component: () => import(/* webpackChunkName: "stagers" */ '../views/Stagers.vue'),
  },
  {
    path: '/agents',
    name: 'agents',
    component: () => import(/* webpackChunkName: "agents" */ '../views/Agents.vue'),
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
    path: '/credentials',
    name: 'credentials',
    component: () => import(/* webpackChunkName: "credentials" */ '../views/Credentials.vue'),
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
