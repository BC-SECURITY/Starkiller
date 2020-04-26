import Vue from 'vue';
import Vuetify from 'vuetify';
import 'vuetify/dist/vuetify.min.css';
import colors from 'vuetify/lib/util/colors';

import VuetifyToast from 'vuetify-toast-snackbar';

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
        primary: colors.purple.darken4, // #E53935
        secondary: colors.purple.lighten4, // #FFCDD2
        accent: colors.indigo.base, // #3F51B5
      },
      dark: {
        primary: colors.purple.darken1, // #E53935
        secondary: colors.purple.lighten4, // #FFCDD2
        accent: colors.indigo.base, // #3F51B5
      },
    },
  },
});
