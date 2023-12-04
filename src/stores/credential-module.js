import { defineStore } from "pinia";
import * as credentialApi from "@/api/credential-api";

// eslint-disable-next-line import/prefer-default-export
export const useCredentialStore = defineStore("credential", {
  state: () => ({
    credentials: [],
  }),
  actions: {
    async getCredentials(search) {
      const credentials = await credentialApi.getCredentials(search);
      this.credentials = credentials;
    },
    async deleteCredential(id) {
      await credentialApi.deleteCredential(id);
      const index = this.credentials.findIndex((c) => c.id === id);
      if (index > -1) {
        this.credentials.splice(index, 1);
      }
    },
  },
  getters: {
    credentialIds: (state) => state.credentials.map((c) => c.id),
  },
});
