import { defineStore } from "pinia";
import * as pluginApi from "@/api/plugin-api";

// eslint-disable-next-line import/prefer-default-export
export const usePluginStore = defineStore("plugin", {
  state: () => ({
    plugins: [],
  }),
  actions: {
    async getPlugins() {
      const plugins = await pluginApi.getPlugins();
      this.plugins = plugins;
    },
  },
  getters: {},
});
