<template>
  <div>
    <chat v-if="socket && isChatWidget" :socket="socket" />
  </div>
</template>

<script>
import io from "socket.io-client";
import { mapState, mapGetters } from "vuex";
import Chat from "@/components/Chat.vue";

export default {
  name: "SocketNotifications",
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
      isLoggedIn: "application/isLoggedIn",
      isChatWidget: "application/isChatWidget",
      socketUrl: "application/socketUrl",
      token: "application/token",
      isAutoSubscribeAgents: "application/isAutoSubscribeAgents",
      subscribedAgents: "agent/subscribed",
      agents: "agent/agents",
    }),
  },
  watch: {
    isLoggedIn(val) {
      if (val === true && !this.socket) {
        this.connect();
        this.setHandlers();
        this.setPluginHandlers();
        this.setAgentHandlers();
      }
    },
    socketUrl() {
      if (this.isLoggedIn && !this.socket) {
        this.connect();
        this.setHandlers();
        this.setPluginHandlers();
        this.setAgentHandlers();
      }
    },
    plugins() {
      this.setPluginHandlers();
    },
    subscribedAgents: {
      handler() {
        this.setAgentHandlers();
      },
    },
  },
  mounted() {
    if (!this.socket && this.socketUrl && this.isLoggedIn) {
      this.connect();
      this.setHandlers();
      this.setPluginHandlers();
      this.setAgentHandlers();
    }
  },
  beforeDestroy() {
    this.disconnect();
  },
  methods: {
    connect() {
      console.log("Opening Socket");
      this.socket = io(`${this.socketUrl}`, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        auth: {
          token: `${this.token}`,
        },
      });
    },
    disconnect() {
      console.log("Closing Socket");
      this.socket.close();
      this.socket = null;
    },
    setAgentHandlers() {
      Object.entries(this.subscribedAgents).forEach(
        ([sessionId, subscribed]) => {
          if (!subscribed) {
            this.socket.off(`agents/${sessionId}/task`);
            return;
          }

          this.socket.on(`agents/${sessionId}/task`, (data) => {
            this.$bell.push({
              title: `Task Results for Agent ${data.agent_id}`,
              text: `${data.output?.substring(0, 50)}...`,
              route: {
                name: "agentEdit",
                params: { id: sessionId },
                query: { tab: "tasks" },
              },
            });
          });
        },
      );
    },
    setPluginHandlers() {
      this.plugins.forEach((plugin) => {
        this.socket.on(`plugins/${plugin.name}/notifications`, (data) => {
          this.$bell.push({
            title: `${plugin.name}`,
            text: `${data.message}`,
            // todo instead of color we could add an icon to bells
            // color: this.getColorForPluginMessage(data.message),
          });
        });
      });
    },
    setHandlers() {
      this.socket.on("listeners/new", (data) => {
        this.$bell.push({
          title: "New Listener",
          text: `New Listener '${data.name}' started!`,
          route: {
            name: "listenerEdit",
            params: { id: data.id },
          },
        });
        this.$store.dispatch("listener/addListener", data);
      });

      this.socket.on("agents/new", (data) => {
        this.$bell.push({
          title: "New Agent",
          text: `New Agent '${data.session_id}' callback!`,
          buttonText: "View",
          route: {
            name: "agentEdit",
            params: { id: data.session_id },
          },
        });
        this.$store.dispatch("agent/addAgent", data);
      });

      this.socket.on("reconnect_failed", () => {
        console.log("Failed to connect to SocketIO");
        this.$snack.error("Failed to connect to SocketIO");
      });
      this.socket.on("connect_error", () => {
        console.log("SocketIO Connection Error, retrying.");
        // a bit too noisy to popup on every reconnect attempt.
        // this.$snack.warn('SocketIO Connection Error, retrying.');
      });
    },
    getColorForPluginMessage(message) {
      if (message.startsWith("[!]")) {
        return "error";
      }

      if (message.startsWith("[*]")) {
        return "";
      }
      if (message.startsWith("[>]")) {
        return "warning";
      }
      if (message.startsWith("[+]")) {
        return "success";
      }
      return "";
    },
  },
};
</script>
