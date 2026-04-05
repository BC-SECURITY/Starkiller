import { createVuetify } from "vuetify";
import * as labsComponents from "vuetify/labs/components";
import { aliases } from "vuetify/iconsets/fa";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import "@fortawesome/fontawesome-free/css/all.css";
import { h } from "vue";

// Custom icon component that auto-detects FA vs MDI based on icon name prefix
const autoIconComponent = {
  props: {
    icon: { type: [String, Function, Object], required: true },
    tag: { type: String, default: "i" },
  },
  render() {
    if (typeof this.icon === "string") {
      // MDI icons: mdi-bell-outline -> <i class="mdi mdi-bell-outline">
      if (this.icon.startsWith("mdi-")) {
        return h(this.tag, { class: `mdi ${this.icon}` });
      }
      // Bare FA icons: fa-server -> <i class="fas fa-server">
      if (this.icon.startsWith("fa-")) {
        return h(this.tag, { class: `fas ${this.icon}` });
      }
      // Full FA class strings from aliases: "fas fa-check" -> <i class="fas fa-check">
      return h(this.tag, { class: this.icon });
    }
    // For component icons, render as-is
    return h(this.icon);
  },
};

export default createVuetify({
  components: {
    ...labsComponents,
  },
  theme: {
    defaultTheme: "dark",
    themes: {
      dark: {
        colors: {
          primary: "#f57c00",
          secondary: "#FFB74D",
          accent: "#FF9800",
        },
      },
    },
  },
  icons: {
    defaultSet: "custom",
    aliases,
    sets: {
      custom: {
        component: autoIconComponent,
      },
    },
  },
});
