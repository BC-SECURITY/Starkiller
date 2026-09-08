<template>
  <div v-show="suggestions.length" ref="list" class="autocomplete-suggestions">
    <div
      v-for="(suggestion, index) in suggestions"
      :key="index"
      :class="{ highlighted: index === highlightedIndex }"
      class="suggestion"
      @click="$emit('select', suggestion)"
      @keyup.enter="$emit('select', suggestion)"
    >
      {{ suggestion }}
    </div>
  </div>
</template>

<script>
export default {
  name: "TerminalSuggestions",
  props: {
    suggestions: {
      type: Array,
      default: () => [],
    },
    highlightedIndex: {
      type: Number,
      default: -1,
    },
    // Getter returning { input, prompt } DOM elements. A getter (not a plain
    // object) so the child reads current template refs at position time, never
    // a value captured before the parent's input/prompt were mounted.
    anchor: {
      type: Function,
      required: true,
    },
  },
  emits: ["select"],
  watch: {
    // flush: "post" so the callbacks run AFTER the list re-renders, matching
    // the parent's original $nextTick() timing -- reposition/scroll math reads
    // list geometry (getBoundingClientRect, children[]) that is only correct
    // once the new suggestions have rendered.
    suggestions: {
      handler() {
        this.reposition();
      },
      flush: "post",
    },
    highlightedIndex: {
      handler() {
        this.scrollHighlightedIntoView();
      },
      flush: "post",
    },
  },
  methods: {
    reposition() {
      const { list } = this.$refs;
      const refs = this.anchor?.();
      const input = refs?.input;
      const prompt = refs?.prompt;
      if (!list || !input || !prompt) return;

      const inputRect = input.getBoundingClientRect();
      const promptRect = prompt.getBoundingClientRect();
      const promptWidth = prompt.offsetWidth;

      list.style.top = `${inputRect.bottom}px`;
      list.style.left = `${promptRect.left + promptWidth}px`;
    },
    scrollHighlightedIntoView() {
      const { list } = this.$refs;
      if (!list) return;
      const el = list.children[this.highlightedIndex];
      if (!el) return;

      if (el.offsetTop + el.clientHeight > list.clientHeight) {
        list.scrollTop = el.offsetTop + el.clientHeight - list.clientHeight;
      } else if (el.offsetTop < list.scrollTop) {
        list.scrollTop = el.offsetTop;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.autocomplete-suggestions {
  position: fixed;
  background-color: #3c3f43;
  border: 1px solid #57d9a3;
  border-radius: 5px;
  z-index: 10;
  max-height: 150px;
  overflow-y: auto;
  box-sizing: border-box;
  margin-top: 5px;
  font-family: "Courier New", Courier, monospace;
  font-size: 14px;
  color: white;
}

.suggestion {
  padding: 5px 10px;
  cursor: pointer;
}

.suggestion:hover {
  background-color: #3c3f43;
}

.highlighted {
  background-color: #007bff;
  color: white;
}
</style>
