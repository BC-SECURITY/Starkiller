import { defineStore } from "pinia";
import * as stagerApi from "@/api/stager-api";

// eslint-disable-next-line import/prefer-default-export
export const useStagerStore = defineStore("stager", {
  state: () => ({
    stagers: [],
    templates: [],
    status: "success",
  }),
  actions: {
    async getStagers() {
      this.status = "loading";
      const stagers = await stagerApi.getStagers();
      this.stagers = stagers;
      this.status = "success";
    },
    async getStagerTemplates() {
      const templates = await stagerApi.getStagerTemplates();
      this.templates = templates;
    },
    async deleteStager(id) {
      await stagerApi.deleteStager(id);
      this.removeStager(id);
    },
    removeStager(id) {
      const index = this.stagers.findIndex((s) => s.id === id);
      if (index > -1) {
        this.stagers.splice(index, 1);
      }
    },
  },
  getters: {
    templateIds: (state) => [...state.templates.map((el) => el.id)].sort(),
  },
});
