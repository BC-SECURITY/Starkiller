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
      <template v-for="m in messages" :key="m.id">
        <!-- System message -->
        <div v-if="m.type === 'system'" class="chat-msg-system">
          <span>{{ m.text }}</span>
        </div>

        <!-- My message -->
        <div v-else-if="m.author === 'me'" class="chat-msg chat-msg--me">
          <div class="chat-msg__bubble chat-msg__bubble--me">
            <chat-message-content :text="m.text" />
          </div>
        </div>

        <!-- Other's message -->
        <div v-else class="chat-msg chat-msg--other">
          <v-avatar
            size="24"
            :image="getAvatar(m.author)"
            class="chat-msg__avatar"
          />
          <div class="chat-msg__body">
            <span class="chat-msg__author">{{ m.author }}</span>
            <div class="chat-msg__bubble chat-msg__bubble--other">
              <chat-message-content :text="m.text" />
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Input -->
    <template #append>
      <chat-composer
        v-model="inputText"
        @send="send"
        @resize="scrollToBottom"
      />
    </template>
  </v-navigation-drawer>
</template>

<script>
import { nextTick } from "vue";
import { useUserStore } from "@/stores/user-module";
import { useApplicationStore } from "@/stores/application-module";
import { useSocketHandlers } from "@/composables/useSocketHandlers";
import ChatMessageContent from "@/components/chat/ChatMessageContent.vue";
import ChatComposer from "@/components/chat/ChatComposer.vue";

export default {
  name: "Chat",
  components: {
    ChatMessageContent,
    ChatComposer,
  },
  props: {
    socket: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    // Register socket handlers through the composable so they are automatically
    // removed when this component unmounts. Passing props.socket by value is
    // intentional: the parent assigns the socket once and only clears it on
    // disconnect, which unmounts this component (it renders us behind
    // v-if="socket && chatWidget"). The reference never changes underneath us,
    // so we don't need reactive access — hence the disable below.
    // eslint-disable-next-line vue/no-setup-props-destructure
    const { on, emit } = useSocketHandlers(props.socket);
    return { on, emit };
  },
  data() {
    return {
      rawParticipants: [],
      messages: [],
      nextMessageId: 0,
      newMessagesCount: 0,
      historyLoaded: false,
      inputText: "",
      showParticipants: false,
      historyTimer: null,
    };
  },
  computed: {
    // Backed by the store rather than local state: the app bar's chat button
    // can be clicked before this component exists (it is async, and gated on
    // the socket), so the flag has to outlive and predate the component.
    isChatOpen: {
      get() {
        return this.applicationStore.chatOpen;
      },
      set(val) {
        this.applicationStore.chatOpen = val;
      },
    },
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
    // Must be "messages.length", not "messages". addMessage() push()es onto
    // the array without replacing it, and an Options API watcher on the array
    // itself only tracks the property, not its contents — so it never fired
    // and the list never followed a new message. Watching length tracks the
    // mutation directly, and is cheaper than deep: true (which would walk
    // every message object on every insert).
    "messages.length"() {
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
    // Registered via the composable's on() so they are removed on unmount.
    this.on("chat/join", (data) => {
      if (!this.isChatOpen && this.historyLoaded) this.newMessagesCount++;
      this.addMessage({ type: "system", text: data.message });
      this.addUser(data.user);
    });
    this.on("chat/leave", (data) => {
      if (!this.isChatOpen && this.historyLoaded) this.newMessagesCount++;
      this.addMessage({ type: "system", text: data.message });
      this.removeUser(data.user);
    });
    this.on("chat/message", (data) => {
      // Skip our own messages — already added locally in send()
      // But allow them during history loading so past messages appear
      if (data.username === this.me && this.historyLoaded) return;
      if (!this.isChatOpen && this.historyLoaded) this.newMessagesCount++;
      this.addMessage({
        type: "text",
        author: data.username === this.me ? "me" : data.username,
        text: data.message,
      });
    });
    this.on("chat/participants", (data) => {
      this.rawParticipants = data;
    });
    this.emit("chat/join");
    this.emit("chat/history");
    this.emit("chat/participants");
    // Mark history as loaded after a short delay to allow history messages through
    this.historyTimer = setTimeout(() => {
      this.historyLoaded = true;
    }, 1000);
  },
  unmounted() {
    this.emit("chat/leave");
    // Cancel the pending history-loaded timer if we unmount before it fires.
    if (this.historyTimer) {
      clearTimeout(this.historyTimer);
      this.historyTimer = null;
    }
  },
  methods: {
    addMessage(message) {
      this.messages.push({ id: this.nextMessageId++, ...message });
    },
    send() {
      const text = this.inputText.trim();
      if (!text) return;
      this.emit("chat/message", { message: text });
      this.addMessage({ type: "text", author: "me", text });
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

  // A bubble holding a code block or a table takes the full drawer width:
  // code wraps rather than scrolls, and a table needs the extra room before
  // its own scroll container kicks in — either way width determines
  // legibility. Driven off the class names the markdown renderer already
  // emits, so nothing has to parse the message a second time to derive it.
  &:has(.chat-code, .chat-table) {
    max-width: 100%;
  }

  &__body {
    min-width: 0;
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
    // Required, not cosmetic. In the "me" branch the bubble is a direct flex
    // item of .chat-msg (the "other" branch nests it inside .chat-msg__body,
    // which sets this above), so it would otherwise keep min-width: auto —
    // and a table's nowrap cells then drive its min-content size straight
    // past the drawer, defeating .chat-table's own overflow-x and putting a
    // horizontal scrollbar on the whole message list.
    min-width: 0;
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
</style>
