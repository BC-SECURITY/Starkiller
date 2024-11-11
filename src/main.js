import Vue from "vue";
import Chat from "vue-beautiful-chat";
import { createPinia, PiniaVuePlugin } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

import App from "./App.vue";
import router from "./router";

import "@fontsource/roboto";
import vuetify from "./plugins/vuetify";

Vue.use(Chat);

Vue.use(PiniaVuePlugin);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
Vue.use(pinia);
Vue.config.productionTip = false;

new Vue({
  vuetify,
  pinia,
  router,
  render: (h) => h(App),
}).$mount("#app");
