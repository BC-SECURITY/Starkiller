<template>
  <v-snackbar
    v-model="notification.enabled"
    :color="notification.color"
    transition="scroll-y-transition"
    left
    bottom
    app
  >
    {{ notification.text }}

    <template #action="{ attrs }">
      <v-btn
        v-if="notification.showButton"
        :color="notification.color === 'error'
          || notification.color === 'warning'
          || notification.color === 'success'
          ? 'white'
          : 'orange darken-2'"
        text
        v-bind="attrs"
        @click="notification.buttonAction"
      >
        {{ notification.buttonText }}
      </v-btn>
      <v-btn
        v-if="notification.dismissable"
        class="ml-2"
        icon
        x-small
        @click="notification.enabled = false"
      >
        <v-icon>fa-times</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
export default {
  name: 'StarkillerSnackbar',
  data() {
    return {
      queue: [],
      notification: { enabled: false },
    };
  },
  watch: {
    queue: {
      deep: true,
      handler(val) {
        if (val.length > 0 && this.notification.enabled === false) {
          this.notification = val.shift();
        }
      },
    },
    'notification.enabled': {
      async handler(val) {
        if (this.queue.length > 0 && val === false) {
          // give transition time.
          setTimeout(() => { this.notification = this.queue.shift(); }, 500);
        }
      },
    },
  },
  methods: {
    error(obj) {
      if (typeof obj === 'string') {
        this.q({ text: obj, color: 'error' });
      } else {
        this.q({ ...obj, color: 'error' });
      }
    },
    warn(obj) {
      if (typeof obj === 'string') {
        this.q({ text: obj, color: 'warning' });
      } else {
        this.q({ ...obj, color: 'warning' });
      }
    },
    success(obj) {
      if (typeof obj === 'string') {
        this.q({ text: obj, color: 'success' });
      } else {
        this.q({ ...obj, color: 'success' });
      }
    },
    info(obj) {
      if (typeof obj === 'string') {
        this.q({ text: obj });
      } else {
        this.q({ ...obj });
      }
    },
    q({
      text,
      buttonText = 'View',
      showButton = false,
      buttonAction,
      color = '',
      dismissable = true,
    }) {
      this.queue.push({
        text, buttonText, showButton, buttonAction, enabled: true, color, dismissable,
      });
    },
  },
};
</script>

<style>

</style>
