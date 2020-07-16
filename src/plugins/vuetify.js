import Vue from 'vue';
import Vuetify from 'vuetify';
import colors from 'vuetify/lib/util/colors';
import 'vuetify/dist/vuetify.min.css';
import '@mdi/font/css/materialdesignicons.css';

import VuetifyToast from 'vuetify-toast-snackbar-ng';

Vue.use(Vuetify);
Vue.use(VuetifyToast, {
  x: 'right',
  y: 'top',
  color: 'accent',
});


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
