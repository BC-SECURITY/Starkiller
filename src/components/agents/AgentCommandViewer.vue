<template>
  <div class="agent-command-viewer">
    <v-icon
      v-if="!initialized"
      style="width: 50px;"
      class="fa-3x fas fa-spinner fa-spin"
    />
    <ul class="shell-body">
      <agent-command-viewer-entry
        v-for="result in agentResults"
        :key="result.taskID"
        :result="result"
      />
    </ul>
  </div>
</template>

<script>
import AgentCommandViewerEntry from './AgentCommandViewerEntry.vue';

export default {
  components: { AgentCommandViewerEntry },
  props: {
    name: {
      type: String,
      required: true,
    },
    taskResults: {
      type: Array,
      default: () => [],
    },
    initialized: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      interval: null,
    };
  },
  computed: {
    agentResults() {
      return this.taskResults.length > 0
        ? this.taskResults.map((res) => ({
          taskID: res.taskID,
          command: res.command,
          results: res.results ? res.results.split('\\n') : '',
          ogResults: res.results ? res.results.split('\\n').join('\n') : '',
          username: res.username ? res.username : 'unknown',
          updatedAt: res.updated_at,
        })).slice(-10)
        : [];
    },
    totalLength() {
      return [
        ...this.agentResults.map((el) => el.command).filter((command) => command.length > 0),
        ...this.agentResults.map((el) => el.results).filter((result) => result.length > 0),
      ];
    },
  },
  watch: {
    /**
     * Update the DOM scroll if the total length of the results, input and output, changes.
     */
    totalLength(val, oldVal) {
      if (val.length !== oldVal.length) {
        this.$nextTick(() => {
          this.$emit('new-results');
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.agent-command-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #141414;
}

/* https://guides.codechewing.com/mac-terminal-shell-css-html */
.shell-body {
  margin: 0;
  padding: 5px;
  list-style: none;
  background: #141414;
  color: #45D40C;
  font: 0.8em 'Andale Mono', Consolas, 'Courier New';
  line-height: 1.6em;

  -webkit-border-bottom-right-radius: 3px;
  -webkit-border-bottom-left-radius: 3px;
  -moz-border-radius-bottomright: 3px;
  -moz-border-radius-bottomleft: 3px;
  border-bottom-right-radius: 3px;
  border-bottom-left-radius: 3px;
}
</style>
