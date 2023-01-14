import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
import colors from 'vuetify/lib/util/colors';
import PortalVue from 'portal-vue';

import '@mdi/font/css/materialdesignicons.css';
import '@fortawesome/fontawesome-free/css/all.css';

Vue.use(PortalVue);
Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: colors.orange.darken2,
        secondary: colors.orange.lighten2,
        accent: colors.orange.base,
      },
      dark: {
        primary: colors.orange.darken2,
        secondary: colors.orange.lighten2,
        accent: colors.orange.base,
      },
    },
  },
});
