import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

import App from "./App.vue";
import router from "./router";

import "@fontsource/roboto";
import vuetify from "./plugins/vuetify";

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.config.errorHandler = (err, instance, info) => {
  console.error(`[Starkiller] Unhandled error in ${info}:`, err);
  try {
    // eslint-disable-next-line no-underscore-dangle
    const root = instance?.$?.appContext?.app?._instance;
    const snack = root?.proxy?.$data?.snackProxy;
    if (snack) {
      snack.error(`Unexpected error: ${err.message || err}`);
    }
  } catch (secondaryErr) {
    console.warn(
      "[Starkiller] Could not display error notification:",
      secondaryErr,
    );
  }
};

app.use(pinia);
app.use(router);
app.use(vuetify);

app.mount("#app");
