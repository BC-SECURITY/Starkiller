import { defineStore } from "pinia";
import * as bypassApi from "@/api/bypass-api";

// eslint-disable-next-line import/prefer-default-export
export const useBypassStore = defineStore("bypass", {
  state: () => ({
    bypasses: [],
  }),
  actions: {
    async getBypasses() {
      const bypasses = await bypassApi.getBypasses();
      this.bypasses = bypasses;
    },
    async deleteBypass(id) {
      await bypassApi.deleteBypass(id);
      const index = this.bypasses.findIndex((p) => p.id === id);
      if (index > -1) {
        this.bypasses.splice(index, 1);
      }
    },
  },
  getters: {
    bypassNames: (state) => state.bypasses.map((el) => el.name),
    defaultBypassNames: (state) =>
      state.bypasses.filter((el) => el.is_default).map((el) => el.name),
    mergedBypassNames: (state) => {
      const all = state.bypasses.map((el) => el.name);
      const defaults = state.bypasses
        .filter((el) => el.is_default)
        .map((el) => el.name);
      const seen = new Set();
      const ordered = [];
      // defaults first
      defaults.forEach((name) => {
        if (!seen.has(name)) {
          seen.add(name);
          ordered.push(name);
        }
      });
      // then rest
      all.forEach((name) => {
        if (!seen.has(name)) {
          seen.add(name);
          ordered.push(name);
        }
      });
      return ordered;
    },
  },
});
