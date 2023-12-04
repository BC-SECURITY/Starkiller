import { defineStore } from "pinia";
import * as listenerApi from "@/api/listener-api";

// eslint-disable-next-line import/prefer-default-export
export const useListenerStore = defineStore("listener", {
  state: () => ({
    listeners: [],
    status: "success",
    templates: [],
  }),
  actions: {
    async getListeners() {
      this.status = "loading";
      const listeners = await listenerApi.getListeners();
      this.listeners = listeners;
      this.status = "success";
    },
    async getListenerTemplates() {
      const templates = await listenerApi.getListenerTemplates();
      this.templates = templates;
    },
    async killListener(id) {
      await listenerApi.killListener(id);
      this.removeListener(id);
    },
    async addListener(listener) {
      const found = this.listeners.find((el) => el.id === listener.id);
      if (!found) {
        this.listeners.push(listener);
      }
    },
    removeListener(id) {
      const index = this.listeners.findIndex((l) => l.id === id);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    },
  },
  getters: {
    listenerNames: (state) => state.listeners.map((el) => el.name),
    templateIds: (state) => [...state.templates.map((el) => el.id)].sort(),
  },
});
