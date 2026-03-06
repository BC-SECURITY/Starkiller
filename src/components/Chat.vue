<template>
  <v-navigation-drawer
    v-model="isChatOpen"
    location="right"
    temporary
    width="380"
    class="chat-drawer"
  >
    <!-- Header -->
    <template #prepend>
      <div class="chat-header">
        <div class="d-flex align-center">
          <v-spacer />
          <v-btn
            icon
            variant="text"
            size="x-small"
            class="chat-header__btn"
            @click="showParticipants = !showParticipants"
          >
            <v-icon size="16">mdi-account-group</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="x-small"
            class="chat-header__btn"
            @click="isChatOpen = false"
          >
            <v-icon size="16">mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Participant Bar -->
        <v-expand-transition>
          <div v-if="showParticipants" class="chat-participants">
            <div
              v-for="p in participants"
              :key="p.id"
              class="chat-participants__user"
            >
              <v-avatar size="22" :image="p.imageUrl" />
              <span
                class="chat-participants__status"
                :class="{ 'chat-participants__status--online': p.online }"
              />
              <span class="chat-participants__name">{{ p.name }}</span>
            </div>
          </div>
        </v-expand-transition>
      </div>
    </template>

    <!-- Messages Area -->
    <div ref="messageContainer" class="chat-messages">
      <template v-for="(m, i) in messages" :key="i">
        <!-- System message -->
        <div v-if="m.type === 'system'" class="chat-msg-system">
          <span>{{ m.text }}</span>
        </div>

        <!-- My message -->
        <div v-else-if="m.author === 'me'" class="chat-msg chat-msg--me">
          <div class="chat-msg__bubble chat-msg__bubble--me">
            {{ m.text }}
          </div>
        </div>

        <!-- Other's message -->
        <div v-else class="chat-msg chat-msg--other">
          <v-avatar
            size="24"
            :image="getAvatar(m.author)"
            class="chat-msg__avatar"
          />
          <div>
            <span class="chat-msg__author">{{ m.author }}</span>
            <div class="chat-msg__bubble chat-msg__bubble--other">
              {{ m.text }}
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Input -->
    <template #append>
      <div class="chat-input">
        <v-text-field
          v-model="inputText"
          placeholder="Message..."
          variant="plain"
          density="compact"
          hide-details
          class="chat-input__field"
          @keyup.enter="send"
        >
          <template #append-inner>
            <v-btn
              icon
              variant="text"
              size="x-small"
              :disabled="!inputText.trim()"
              @click="send"
            >
              <v-icon
                size="18"
                :color="inputText.trim() ? '#F37C22' : undefined"
              >
                mdi-send
              </v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script>
import { nextTick } from "vue";
import { useUserStore } from "@/stores/user-module";
import { useApplicationStore } from "@/stores/application-module";

export default {
  name: "Chat",
  props: {
    socket: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      rawParticipants: [],
      messages: [],
      newMessagesCount: 0,
      historyLoaded: false,
      isChatOpen: false,
      inputText: "",
      showParticipants: false,
    };
  },
  computed: {
    userStore() {
      return useUserStore();
    },
    allUsers() {
      return this.userStore.users;
    },
    applicationStore() {
      return useApplicationStore();
    },
    me() {
      return this.applicationStore.user.username;
    },
    onlineCount() {
      return this.rawParticipants.length;
    },
    participants() {
      return this.allUsers.map((user) => {
        const mapped = this.mapUser(user);
        mapped.online =
          this.rawParticipants.find((p) => p === mapped.name) !== undefined;
        return mapped;
      });
    },
  },
  watch: {
    messages() {
      this.scrollToBottom();
    },
    newMessagesCount(val) {
      this.applicationStore.chatUnreadCount = val;
    },
    isChatOpen(val) {
      if (val) this.newMessagesCount = 0;
    },
  },
  mounted() {
    this.userStore.getUsers();
    this.socket.on("chat/join", (data) => {
      if (!this.isChatOpen && this.historyLoaded) this.newMessagesCount++;
      this.messages.push({ type: "system", text: data.message });
      this.addUser(data.user);
    });
    this.socket.on("chat/leave", (data) => {
      if (!this.isChatOpen && this.historyLoaded) this.newMessagesCount++;
      this.messages.push({ type: "system", text: data.message });
      this.removeUser(data.user);
    });
    this.socket.on("chat/message", (data) => {
      // Skip our own messages — already added locally in send()
      // But allow them during history loading so past messages appear
      if (data.username === this.me && this.historyLoaded) return;
      if (!this.isChatOpen && this.historyLoaded) this.newMessagesCount++;
      this.messages.push({
        type: "text",
        author: data.username === this.me ? "me" : data.username,
        text: data.message,
      });
    });
    this.socket.on("chat/participants", (data) => {
      this.rawParticipants = data;
    });
    this.socket.emit("chat/join");
    this.socket.emit("chat/history");
    this.socket.emit("chat/participants");
    // Mark history as loaded after a short delay to allow history messages through
    setTimeout(() => {
      this.historyLoaded = true;
    }, 1000);
  },
  unmounted() {
    this.socket.emit("chat/leave");
  },
  methods: {
    open() {
      this.isChatOpen = true;
    },
    send() {
      const text = this.inputText.trim();
      if (!text) return;
      this.socket.emit("chat/message", { message: text });
      this.messages.push({ type: "text", author: "me", text });
      this.inputText = "";
    },
    scrollToBottom() {
      nextTick(() => {
        const el = this.$refs.messageContainer;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },
    addUser(user) {
      if (this.rawParticipants.find((u) => u === user.username)) return;
      this.rawParticipants.push(user.username);
    },
    removeUser(user) {
      const index = this.rawParticipants.findIndex((u) => u === user.username);
      if (index > -1) {
        this.rawParticipants.splice(index, 1);
      }
    },
    getAvatar(username) {
      const user = this.allUsers.find((u) => u.username === username);
      return (
        user?.avatarUrl ||
        `https://ui-avatars.com/api/?background=random&name=${username}`
      );
    },
    mapUser(user) {
      return {
        id: user.username,
        name: user.username,
        imageUrl:
          user.avatarUrl ||
          `https://ui-avatars.com/api/?background=random&name=${user.username}`,
      };
    },
  },
};
</script>

<style lang="scss">
.chat-drawer {
  .v-navigation-drawer__content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.chat-header {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);

  &__btn {
    opacity: 0.5;
    &:hover {
      opacity: 1;
    }
  }
}

.chat-participants {
  padding-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  &__user {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px 2px 2px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.04);
  }

  &__status {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #555;

    &--online {
      background: #4caf50;
      box-shadow: 0 0 4px rgba(76, 175, 80, 0.5);
    }
  }

  &__name {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 0.02em;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-msg-system {
  text-align: center;
  padding: 4px 0;

  span {
    font-size: 10px;
    letter-spacing: 0.04em;
    color: rgba(255, 255, 255, 0.25);
  }
}

.chat-msg {
  display: flex;
  max-width: 85%;

  &--me {
    align-self: flex-end;
  }

  &--other {
    align-self: flex-start;
    gap: 8px;
  }

  &__avatar {
    flex-shrink: 0;
    margin-top: 14px;
  }

  &__author {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: rgba(255, 255, 255, 0.35);
    text-transform: uppercase;
    margin-bottom: 2px;
    display: block;
  }

  &__bubble {
    padding: 8px 12px;
    font-size: 13px;
    line-height: 1.4;
    border-radius: 12px;

    &--me {
      background: rgba(243, 124, 34, 0.15);
      border: 1px solid rgba(243, 124, 34, 0.2);
      border-radius: 12px 12px 2px 12px;
      color: rgba(255, 255, 255, 0.85);
    }

    &--other {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px 12px 12px 2px;
      color: rgba(255, 255, 255, 0.75);
    }
  }
}

.chat-input {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.15);

  &__field {
    font-size: 13px;
  }
}
</style>
