<template>
  <div>
    <chat
      v-if="socket && isChatWidget"
      :socket="socket"
    />
  </div>
</template>

<script>
import io from 'socket.io-client';
import { mapState, mapGetters } from 'vuex';
import Chat from '@/components/Chat.vue';

export default {
  name: 'SocketNotifications',
  components: {
    Chat,
  },
  data() {
    return {
      socket: null,
    };
  },
  computed: {
    ...mapState({
      user: (state) => state.application.user,
      plugins: (state) => state.plugin.plugins,
    }),
    ...mapGetters({
      isLoggedIn: 'application/isLoggedIn',
      isChatWidget: 'application/isChatWidget',
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
    plugins() {
      this.setHandlers();
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
        this.$snack.info({
          text: `New Listener '${data.name}' started!`,
          buttonText: 'View',
          showButton: true,
          buttonAction: () => this.$router.push({
            name: 'listenerEdit',
            params: { id: data.name },
          }),
          dismissable: true,
        });
        this.$store.dispatch('listener/addListener', data);
      });
      this.socket.on('agents/new', (data) => {
        this.$snack.info({
          text: `New Agent '${data.session_id}' callback!`,
          buttonText: 'View',
          showButton: true,
          buttonAction: () => this.$router.push({
            name: 'agentEdit',
            params: { id: data.session_id },
          }),
          dismissable: true,
        });
        this.$store.dispatch('agent/addAgent', data);
      });
      this.socket.on('agents/stage2', (data) => {
        this.$store.dispatch('agent/addAgent', data);
      });
      this.plugins.forEach((plugin) => {
        this.socket.on(`plugins/${plugin.Name}/notifications`, (data) => {
          this.$snack.info({
            text: `${data.plugin_name}: ${data.message}`,
            color: this.getColorForPluginMessage(data.message),
          });
        });
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
    getColorForPluginMessage(message) {
      if (message.startsWith('[!]')) {
        return 'error';
      } if (message.startsWith('[*]')) {
        return '';
      } if (message.startsWith('[>]')) {
        return 'warning';
      } if (message.startsWith('[+]')) {
        return 'success';
      }
      return '';
    },
  },
};
</script>
