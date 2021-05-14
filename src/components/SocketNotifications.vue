<template>
  <v-snackbar
    v-model="socketNotification.enabled"
    right
    top
    app
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
// TODO Might be able to merge the snackbar and just let this handle receiving messages.
import io from 'socket.io-client';
import { mapState, mapGetters } from 'vuex';

export default {
  name: 'SocketNotifications',
  data() {
    return {
      socket: null,
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
    ...mapGetters({
      isLoggedIn: 'application/isLoggedIn',
      socketUrl: 'application/socketUrl',
    }),
    apiToken() {
      return this.user.api_token;
    },
  },
  watch: {
    isLoggedIn(val) {
      if (val === true && !this.socket) {
        this.connect();
        this.setHandlers();
      }
    },
    socketUrl() {
      if (this.isLoggedIn && !this.socket) {
        this.connect();
        this.setHandlers();
      }
    },
  },
  mounted() {
    if (!this.socket && this.socketUrl && this.isLoggedIn) {
      this.connect();
      this.setHandlers();
    }
  },
  beforeDestroy() {
    this.disconnect();
  },
  methods: {
    connect() {
      console.log('Opening Socket');
      this.socket = io(`${this.socketUrl}?token=${this.apiToken}`, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      });
    },
    disconnect() {
      console.log('Closing Socket');
      this.socket.close();
      this.socket = null;
    },
    setHandlers() {
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
      this.socket.on('reconnect_failed', () => {
        console.log('Failed to connect to SocketIO');
        this.$snack.error('Failed to connect to SocketIO');
      });
      this.socket.on('connect_error', () => {
        console.log('SocketIO Connection Error, retrying.');
        // a bit too noisy to popup on every reconnect attempt.
        // this.$snack.warn('SocketIO Connection Error, retrying.');
      });
      // this.socket.on('agents/task', (data) => {
      //   // const { sessionID, taskID, data } = data;
      //   this.$store.dispatch('agent/addResult', { data });
      // });
    },
    goToRoute() {
      this.$router.push({
        name: this.socketNotification.route,
        params: { id: this.socketNotification.id },
      });
    },
  },
};
</script>
