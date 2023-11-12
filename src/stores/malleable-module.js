import { defineStore } from "pinia";
import * as malleableApi from "@/api/malleable-api";

// eslint-disable-next-line import/prefer-default-export
export const useMalleableProfileStore = defineStore("malleableProfile", {
  state: () => ({
    malleableProfiles: [],
  }),
  actions: {
    async getMalleableProfiles() {
      const profiles = await malleableApi.getMalleableProfiles();
      this.malleableProfiles = profiles;
    },
    async deleteMalleableProfile(id) {
      await malleableApi.deleteMalleableProfile(id);
      const index = this.malleableProfiles.findIndex((p) => p.id === id);
      if (index > -1) {
        this.malleableProfiles.splice(index, 1);
      }
    },
  },
  getters: {
    profileNames: (state) => state.malleableProfiles.map((el) => el.name),
  },
});
