import * as userApi from '@/api/user-api';

export default {
  namespaced: true,
  state: {
    token: '',
    url: '',
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
      context.commit('setUsers', response);
    },
    // async createUser(context, { username, password }) {
    //   await userApi.addUser(username, password);
    //   context.dispatch('getUsers');
    // },
  },
  getters: {
  },
};
