<template>
  <div class="chat-input">
    <v-textarea
      :model-value="modelValue"
      placeholder="Message..."
      variant="plain"
      density="compact"
      hide-details
      rows="1"
      max-rows="6"
      auto-grow
      no-resize
      class="chat-input__field"
      @update:model-value="$emit('update:modelValue', $event)"
      @keydown.enter="onEnter"
    >
      <template #append-inner>
        <v-btn
          icon
          variant="text"
          size="x-small"
          :disabled="!modelValue.trim()"
          @click="$emit('send')"
        >
          <v-icon size="18" :color="modelValue.trim() ? '#F37C22' : undefined">
            mdi-send
          </v-icon>
        </v-btn>
      </template>
    </v-textarea>
  </div>
</template>

<script>
export default {
  name: "ChatComposer",
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: ["update:modelValue", "send", "resize"],
  mounted() {
    // auto-grow takes its height out of the message list (flex: 1) without
    // touching that list's scrollTop, so composing a multi-line message
    // silently pushes the newest messages out of view. The parent re-pins the
    // list on this event. ResizeObserver rather than a watcher on modelValue:
    // the height changes on wrap, not on every keystroke, and only the
    // rendered box knows when that happens.
    this.resizeObserver = new ResizeObserver(() => this.$emit("resize"));
    this.resizeObserver.observe(this.$el);
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  },
  methods: {
    onEnter(event) {
      // Shift+Enter inserts a newline — let the textarea handle it.
      if (event.shiftKey) return;
      // Enter confirming an IME candidate must not send a half-typed message.
      if (event.isComposing) return;
      // Deliberate: Enter always means "send" when Shift is not held, so
      // whitespace-only input is swallowed here rather than falling through
      // to insert a newline — an operator cannot open a message with a blank
      // line this way.
      event.preventDefault();
      if (!this.modelValue.trim()) return;
      this.$emit("send");
    },
  },
};
</script>

<style lang="scss">
.chat-input {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.15);

  &__field {
    font-size: 13px;
  }
}
</style>
