import * as userApi from "@/api/user-api";
import * as downloadApi from "@/api/download-api";

export default {
  namespaced: true,
  state: {
    token: "",
    url: "",
    users: [],
  },
  mutations: {
    setUsers(state, users) {
      state.users = users;
    },
  },
  actions: {
    async getUsers(context) {
      const response = await userApi.getUsers();

      await Promise.all(
        response.map(async (user) => {
          if (user.avatar) {
            user.avatarUrl = await downloadApi.getDownloadAsUrl(user.avatar.id);
          }
        }),
      );

      context.commit("setUsers", response);
    },
  },
  getters: {},
};
