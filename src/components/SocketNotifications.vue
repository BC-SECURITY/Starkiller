<template>
  <div>
    <chat v-if="socket && chatWidget" ref="chat" :socket="socket" />
    <!-- Persistent connection-state banner. :timeout="-1" means it never
         auto-dismisses, since it reflects ongoing connection state rather
         than a one-off event -- deliberately a separate v-snackbar from
         the shared `snack` queue (StarkillerSnackbar.vue), which is
         transient/dismissable and could bury or be buried by unrelated
         snackbar traffic. -->
    <v-snackbar
      :model-value="showDisconnectedBanner || showReconnectFailedBanner"
      :timeout="-1"
      color="warning"
      location="top"
      multi-line
    >
      <span v-if="showReconnectFailedBanner">
        Lost connection to the server. Live notifications have stopped.
      </span>
      <span v-else>Connection lost — reconnecting…</span>
      <template #actions>
        <v-btn
          v-if="showReconnectFailedBanner"
          variant="text"
          @click="manualReconnect"
        >
          Reconnect
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import io from "socket.io-client";
import { mapState } from "pinia";
import Chat from "@/components/Chat.vue";
import { useListenerStore } from "@/stores/listener-module";
import { usePluginStore } from "@/stores/plugin-module";
import { useApplicationStore } from "@/stores/application-module";
import { useAgentStore } from "@/stores/agent-module";

export default {
  name: "SocketNotifications",
  components: { Chat },
  inject: ["snack", "bell"],
  data() {
    return {
      socket: null,
      // Debounced "reconnecting" indicator -- only shown if still
      // disconnected after a short grace period, so a transient blip that
      // reconnects in under ~2.5s never flashes the banner at all.
      showDisconnectedBanner: false,
      disconnectDebounceTimer: null,
      // Set once socket.io's automatic reconnection cycle gives up
      // entirely (reconnect_failed). Cleared by a successful (re)connect
      // or by the manual "Reconnect" button.
      showReconnectFailedBanner: false,
      // Plugin event names currently registered via setPluginHandlers, so a
      // plugin that drops out of the list (removed) can have its listener
      // torn down explicitly -- nothing else iterates it once it's gone.
      registeredPluginNames: [],
    };
  },
  computed: {
    agentStore() {
      return useAgentStore();
    },
    listenerStore() {
      return useListenerStore();
    },
    pluginStore() {
      return usePluginStore();
    },
    plugins() {
      return this.pluginStore.plugins;
    },
    ...mapState(useApplicationStore, [
      "user",
      "isLoggedIn",
      "chatWidget",
      "socketUrl",
      "token",
    ]),
    ...mapState(useAgentStore, {
      subscribedAgents: "subscribed",
      agents: "agents",
    }),
  },
  watch: {
    // `!this.socket` below means "no socket object has been created yet
    // this session", NOT "is currently connected" -- once created, this.socket
    // stays truthy for the whole session (through disconnects, reconnect
    // attempts, and even a permanent reconnect_failed) and is only ever
    // reset to null in disconnect() (called from beforeUnmount). Recovery
    // from a dropped connection is handled entirely by socket.io's own
    // Manager (automatic reconnection) or by manualReconnect() below --
    // never by recreating the socket object itself.
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
  beforeUnmount() {
    this.clearDisconnectDebounceTimer();
    this.disconnect();
  },
  methods: {
    connect() {
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
      if (!this.socket) return;
      this.socket.close();
      this.socket = null;
    },
    setAgentHandlers() {
      // This watcher re-fires on every agent checkin (subscribedAgents is a
      // new object each time), so always off() immediately before on() --
      // without it, every prior registration for a still-subscribed agent
      // stacks another duplicate handler, and later task-result events for
      // that agent fire the bell push once per stacked handler.
      Object.entries(this.subscribedAgents).forEach(
        ([sessionId, subscribed]) => {
          this.socket.off(`agents/${sessionId}/task`);
          if (!subscribed) {
            return;
          }

          this.socket.on(`agents/${sessionId}/task`, (data) => {
            this.bell.push({
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
      const currentNames = this.plugins.map((plugin) => plugin.name);
      // A plugin removed from the list stops being iterated below, so its
      // listener would otherwise never get torn down -- off() it explicitly.
      this.registeredPluginNames
        .filter((name) => !currentNames.includes(name))
        .forEach((name) => {
          this.socket.off(`plugins/${name}/notifications`);
        });

      this.plugins.forEach((plugin) => {
        // This watcher re-fires on every plugin-list change, so always
        // off() immediately before on() -- same stacking bug as
        // setAgentHandlers above, otherwise.
        this.socket.off(`plugins/${plugin.name}/notifications`);
        this.socket.on(`plugins/${plugin.name}/notifications`, (data) => {
          this.bell.push({
            title: `${plugin.name}`,
            text: `${data.message}`,
            // todo instead of color we could add an icon to bells
            // color: this.getColorForPluginMessage(data.message),
          });
        });
      });

      this.registeredPluginNames = currentNames;
    },
    setHandlers() {
      this.socket.on("listeners/new", (data) => {
        this.bell.push({
          title: "New Listener",
          text: `New Listener '${data.name}' started!`,
          route: {
            name: "listenerEdit",
            params: { id: data.id },
          },
        });
        this.listenerStore.addListener(data);
      });

      this.socket.on("agents/new", (data) => {
        this.bell.push({
          title: "New Agent",
          text: `New Agent '${data.session_id}' callback!`,
          buttonText: "View",
          route: {
            name: "agentEdit",
            params: { id: data.session_id },
          },
        });
        this.agentStore.addAgent(data);
      });

      this.socket.on("connect_error", () => {
        console.log("SocketIO Connection Error, retrying.");
        // a bit too noisy to popup on every reconnect attempt.
        // this.snack.warn('SocketIO Connection Error, retrying.');
      });

      // "connect" fires on the initial connection AND on every successful
      // automatic reconnect -- clears whichever banner was showing.
      this.socket.on("connect", () => {
        this.clearDisconnectDebounceTimer();
        this.showDisconnectedBanner = false;
        this.showReconnectFailedBanner = false;
      });
      this.socket.on("disconnect", () => {
        this.scheduleDisconnectIndicator();
      });

      // reconnect/reconnect_attempt/reconnect_error/reconnect_failed are
      // emitted on the Manager (this.socket.io), NOT on the socket itself --
      // confirmed by reading socket.io-client's source (Socket.subEvents()
      // only relays open/packet/error/close from the Manager) and verified
      // empirically against a live client instance. Registering these on
      // `this.socket` (as this code previously did for reconnect_failed)
      // silently never fires.
      this.socket.io.on("reconnect_failed", () => {
        this.clearDisconnectDebounceTimer();
        this.showDisconnectedBanner = false;
        this.showReconnectFailedBanner = true;
        console.log("Failed to connect to SocketIO");
        this.snack.error("Failed to connect to SocketIO");
      });
    },
    scheduleDisconnectIndicator() {
      this.clearDisconnectDebounceTimer();
      // Debounced so a transient blip that reconnects quickly never flashes
      // the banner at all -- only a connection that's still down after the
      // grace period is worth interrupting the operator about.
      this.disconnectDebounceTimer = setTimeout(() => {
        this.showDisconnectedBanner = true;
        this.disconnectDebounceTimer = null;
      }, 2500);
    },
    clearDisconnectDebounceTimer() {
      if (this.disconnectDebounceTimer) {
        clearTimeout(this.disconnectDebounceTimer);
        this.disconnectDebounceTimer = null;
      }
    },
    // Resumes socket.io's reconnection cycle after it's given up
    // permanently (reconnect_failed). Calls .connect() on the existing
    // socket/Manager rather than this.connect(), which would tear down and
    // replace the whole socket (and re-register every handler) instead of
    // just asking it to retry.
    manualReconnect() {
      this.showReconnectFailedBanner = false;
      this.socket.connect();
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
