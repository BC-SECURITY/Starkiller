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

      await Promise.all(
        response.map(async (user) => {
          if (user.avatar) {
            user.avatarUrl = await downloadApi.getDownloadAsUrl(user.avatar.id);
          }
        }),
      );

      this.users = response;
    },
  },
  getters: {},
});
