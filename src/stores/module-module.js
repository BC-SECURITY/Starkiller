import { defineStore } from "pinia";
import * as moduleApi from "@/api/module-api";

// eslint-disable-next-line import/prefer-default-export
export const useModuleStore = defineStore("module", {
  state: () => ({
    modules: [],
  }),
  actions: {
    async getModules() {
      const modules = await moduleApi.getModules();
      this.modules = modules;
    },
  },
  getters: {},
});
