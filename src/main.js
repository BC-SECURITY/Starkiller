import Vue from 'vue';
import Chat from 'vue-beautiful-chat';
import App from './App.vue';
import router from './router';
import store from './store';

import '@fontsource/roboto';
import vuetify from './plugins/vuetify';

Vue.use(Chat);

Vue.config.productionTip = false;
new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
