<template>
  <div>
    <beautiful-chat
      :participants="participants"
      :on-message-was-sent="onMessageWasSent"
      :message-list="messageList"
      :new-messages-count="newMessagesCount"
      :is-open="isChatOpen"
      :close="closeChat"
      :open="openChat"
      :show-emoji="false"
      :show-file="false"
      :show-edition="false"
      :show-deletion="false"
      :deletion-confirmation="false"
      :show-typing-indicator="showTypingIndicator"
      :show-launcher="true"
      :show-close-button="true"
      :colors="colors"
      :always-scroll-to-bottom="alwaysScrollToBottom"
      :disable-user-list-toggle="false"
      :message-styling="messageStyling"
    >
      <template #user-avatar="{ message, user }">
        <div
          v-if="message.type !== 'system' && user && user.name !== 'me'"
          v-tooltip="user.name"
          :title="user.name"
          class="sc-message--avatar"
          :style="{
            backgroundImage: `url(${user.imageUrl})`,
            width: '40px',
            height: '40px',
          }"
        >
          <div
            :class="user.online ? 'online-indicator' : 'offline-indicator'"
          />
        </div>
      </template>
    </beautiful-chat>
  </div>
</template>

<script>
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
      messageList: [],
      newMessagesCount: 0,
      isChatOpen: false,
      showTypingIndicator: "",
      alwaysScrollToBottom: false,
      // enables *bold* /emph/ _underline_ and such (more info at github.com/mattezza/msgdown)
      messageStyling: true,
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
    darkMode() {
      return this.applicationStore.darkMode;
    },
    colors() {
      if (this.darkMode) {
        return {
          header: { bg: "#F37C22", text: "#FFFFFF" },
          launcher: { bg: "#F37C22" },
          messageList: { bg: "#1E1E1E" },
          userList: { bg: "#1E1E1E" },
          sentMessage: { bg: "#1F89FB", text: "#FFFFFF" },
          receivedMessage: { bg: "#3B3B3D", text: "#E1E1E1" },
          userInput: { bg: "#1C1C1C", text: "#D7D7D7" },
        };
      }
      return {
        header: { bg: "#F37C22", text: "#FFFFFF" },
        launcher: { bg: "#F37C22" },
        messageList: { bg: "#FFFFFF" },
        userList: { bg: "#FFFFFF" },
        sentMessage: { bg: "#1E87FB", text: "#FFFFFF" },
        receivedMessage: { bg: "#E9E9EB", text: "#242424" },
        userInput: { bg: "#FFFFFF", text: "#3A3A3A" },
      };
    },
    participants() {
      // for each user from the main user list
      const temp = this.allUsers.map((user) => {
        // convert it to a a participant
        const user2 = this.mapUser(user);
        // if it exists in the rawParticipants array then they are online
        user2.online =
          this.rawParticipants.find((p) => p === user2.name) !== undefined;
        return user2;
      });
      return temp;
    },
  },
  mounted() {
    this.userStore.getUsers();
    this.socket.on("chat/join", (data) => {
      if (!this.isChatOpen) this.newMessagesCount++;
      const message = { type: "system", data: { text: data.message } };
      this.messageList = [...this.messageList, message];
      this.addUser(data.user);
    });
    this.socket.on("chat/leave", (data) => {
      if (!this.isChatOpen) this.newMessagesCount++;
      const message = { type: "system", data: { text: data.message } };
      this.messageList = [...this.messageList, message];
      this.removeUser(data.user);
    });
    this.socket.on("chat/message", (data) => {
      if (!this.isChatOpen) this.newMessagesCount++;
      if (data.username === this.me) {
        data.username = "me";
      }
      const message = {
        type: "text",
        author: data.username,
        data: { text: data.message },
      };
      this.messageList = [...this.messageList, message];
    });
    this.socket.on("chat/participants", (data) => {
      this.setUsers(data);
    });
    this.socket.emit("chat/join");
    this.socket.emit("chat/history");
    this.socket.emit("chat/participants");
  },
  destroyed() {
    this.socket.emit("chat/leave");
  },
  methods: {
    onMessageWasSent(message) {
      this.socket.emit("chat/message", { message: message.data.text });
    },
    openChat() {
      this.isChatOpen = true;
      this.newMessagesCount = 0;
    },
    closeChat() {
      this.isChatOpen = false;
    },
    handleScrollToTop() {
      // called when the user scrolls message list to top
      // leverage pagination for loading another page of messages
    },
    addUser(user) {
      if (this.rawParticipants.find((u) => u === user.username)) return;
      this.rawParticipants.push(user);
    },
    removeUser(user) {
      const index = this.rawParticipants.findIndex((u) => u === user.username);
      if (index > -1) {
        this.rawParticipants.splice(index, 1);
        this.rawParticipants = [...this.rawParticipants];
      }
    },
    setUsers(users) {
      this.rawParticipants = users;
    },
    mapUser(user) {
      // todo generate avatar images offline.
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

<style>
.sc-chat-window {
  z-index: 99;
}
.sc-launcher {
  z-index: 99;
}
.sc-message--text-content {
  margin-bottom: 0px !important; /* Overriding the v-application paragraph margin */
}
.online-indicator {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: #9dff00;
  -webkit-box-shadow: 0px 0px 0px 1px rgba(112, 112, 112, 1);
  -moz-box-shadow: 0px 0px 0px 1px rgba(112, 112, 112, 1);
  box-shadow: 0px 0px 0px 1px rgba(112, 112, 112, 1);
}
.offline-indicator {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: #f52a0f;
  -webkit-box-shadow: 0px 0px 0px 1px rgba(112, 112, 112, 1);
  -moz-box-shadow: 0px 0px 0px 1px rgba(112, 112, 112, 1);
  box-shadow: 0px 0px 0px 1px rgba(112, 112, 112, 1);
}
</style>
