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
    this.socket = io(`wss://localhost:5000?token=${this.apiToken}`, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 5000,
    }); // todo get from state. Needs to connect with credentials.
    this.socket.on('listeners/new', (data) => {
      this.socketNotification = {
        id: data.name,
        route: 'listenerEdit',
        enabled: true,
        text: `New Listener '${data.name}' started!`,
      };
      this.$store.dispatch('listener/addListener', data);
    });
    this.socket.on('agents/new', (data) => {
      this.socketNotification = {
        id: data.session_id,
        route: 'agentEdit',
        enabled: true,
        text: `New Agent '${data.session_id}' callback!`,
      };
      this.$store.dispatch('agent/addAgent', data);
    });
    this.socket.on('agents/stage2', (data) => {
      this.$store.dispatch('agent/addAgent', data);
    });
    // this.socket.on('agents/task', (data) => {
    //   // const { sessionID, taskID, data } = data;
    //   this.$store.dispatch('agent/addResult', { data });
    // });
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
