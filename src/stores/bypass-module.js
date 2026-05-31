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
    mergedBypassNames: (state) => mergeNames(state.bypasses),
    mergedBypassNamesByLanguage: (state) => (language) => {
      if (!language) return mergeNames(state.bypasses);
      const key = String(language).toLowerCase();
      const filtered = state.bypasses.filter(
        (b) => (b.language || "").toLowerCase() === key,
      );
      return mergeNames(filtered);
    },
    defaultBypassNamesByLanguage: (state) => (language) => {
      const key = language ? String(language).toLowerCase() : null;
      return state.bypasses
        .filter(
          (el) =>
            el.is_default &&
            (!key || (el.language || "").toLowerCase() === key),
        )
        .map((el) => el.name);
    },
  },
});

function mergeNames(bypasses) {
  const seen = new Set();
  const ordered = [];
  bypasses
    .filter((el) => el.is_default)
    .forEach((el) => {
      if (!seen.has(el.name)) {
        seen.add(el.name);
        ordered.push(el.name);
      }
    });
  bypasses.forEach((el) => {
    if (!seen.has(el.name)) {
      seen.add(el.name);
      ordered.push(el.name);
    }
  });
  return ordered;
}
