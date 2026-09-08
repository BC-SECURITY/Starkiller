import { defineStore } from "pinia";
import * as userApi from "@/api/user-api";
import * as downloadApi from "@/api/download-api";

// eslint-disable-next-line import/prefer-default-export
export const useUserStore = defineStore("user", {
  state: () => ({
    token: "",
    url: "",
    users: [],
  }),
  actions: {
    async getUsers() {
      const response = await userApi.getUsers();

      // One user's avatar failing to download (stale reference, deleted
      // file, backend hiccup) must not block every other user from ever
      // being assigned to this.users -- catch per-user so a single bad
      // avatar just means that user shows up without one.
      await Promise.all(
        response.map(async (user) => {
          if (user.avatar) {
            try {
              user.avatarUrl = await downloadApi.getDownloadAsUrl(
                user.avatar.id,
              );
            } catch (err) {
              console.error(`Failed to load avatar for ${user.username}:`, err);
              user.avatarUrl = undefined;
            }
          }
        }),
      );

      this.users = response;
    },
  },
  getters: {},
});
