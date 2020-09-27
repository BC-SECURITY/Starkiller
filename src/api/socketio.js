import io from 'socket.io-client';

const socketio = io(`wss://localhost:5000?token=${this.apiToken}`, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 5000,
});

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

export default socketio;
