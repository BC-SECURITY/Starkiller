import { defineStore } from "pinia";
import * as obfuscationApi from "@/api/obfuscation-api";

// eslint-disable-next-line import/prefer-default-export
export const useObfuscationStore = defineStore("obfuscation", {
  state: () => ({
    keywords: [],
    configs: [],
  }),
  actions: {
    async getKeywords() {
      const keywords = await obfuscationApi.getKeywords();
      this.keywords = keywords;
    },
    async deleteKeyword(id) {
      await obfuscationApi.deleteKeyword(id);
      const index = this.keywords.findIndex((k) => k.id === id);
      if (index > -1) {
        this.keywords.splice(index, 1);
      }
    },
    async getConfigs() {
      const configs = await obfuscationApi.getObfuscationConfigs();
      this.configs = configs;
    },
  },
  getters: {},
});
