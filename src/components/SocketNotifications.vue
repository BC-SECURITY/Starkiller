<template>
  <v-snackbar
    v-model="socketNotification.enabled"
    absolute
    right
    top
  >
    {{ socketNotification.text }}

    <template v-slot:action="{ attrs }">
      <v-btn
        color="orange darken-2"
        text
        v-bind="attrs"
        @click="goToRoute"
      >
        View
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
import io from 'socket.io-client';
import { mapState } from 'vuex';

export default {
  name: 'SocketNotifications',
  data() {
    return {
      socketNotification: {
        enabled: false,
        text: '',
        route: '',
        id: '',
      },
    };
  },
  computed: {
    ...mapState({
      user: state => state.application.user,
    }),
    apiToken() {
      return this.user.api_token;
    },
  },
  mounted() {
    this.socket = io(`wss://localhost:5000?token=${this.apiToken}`); // todo get from state. Needs to connect with credentials.
    this.socket.on('listeners/new', (data) => {
      this.socketNotification = { // todo this should push to the state if it receives a full object
        id: data.name,
        route: 'listenerEdit',
        enabled: true,
        text: `New Listener '${data.name}' started!`,
      };
    });
    this.socket.on('agents/new', (data) => { // todo this should push to the state if it receives a full object
      this.socketNotification = {
        id: data.sessionID,
        route: 'agentEdit',
        enabled: true,
        text: `New Agent '${data.sessionID}' callback!`,
      };
    });
    this.socket.on('agents/task', (data) => {
      // const { sessionID, taskID, data } = data;
      this.$store.dispatch('agent/addResult', { data });
    });
    // this.socket.on('credentials/new')
    // this.socket.on('listeners', (data) => {
    //   this.$toast.success(data);
    // });
    this.socket.on('Users', (data) => {
      this.$toast.success(data);
    });
  },
  methods: {
    goToRoute() {
      this.$router.push({
        name: this.socketNotification.route,
        params: { id: this.socketNotification.id },
      });
    },
  },
};
</script>
