<template>
  <div class="agent-command-viewer">
    <ul class="shell-body">
      <div
        v-for="result in agentResults"
        :key="result.taskID"
      >
        <li>
          <span class="username">({{ result.username }})</span>&nbsp;{{ result.command }}
        </li>
        <li> {{ result.ogResults }}</li>
      </div>
    </ul>
  </div>
</template>

<script>
import * as agentApi from '@/api/agent-api';

export default {
  props: {
    name: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      commands: [],
      results: [],
      interval: null,
    };
  },
  computed: {
    agentResults() {
      return this.results.length > 0
        ? this.results[0].AgentResults.map(res => ({
          taskID: res.taskID,
          command: res.command,
          results: res.results ? res.results.split('\\n') : '',
          ogResults: res.results ? res.results.split('\\n').join('\n') : '',
          username: res.username ? res.username : 'unknown',
        }))
        : [];
    },
    totalLength() {
      return [
        ...this.agentResults.map(el => el.command).filter(command => command.length > 0),
        ...this.agentResults.map(el => el.results).filter(result => result.length > 0),
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
  mounted() {
    this.interval = setInterval(async () => {
      this.results = await agentApi.getResults(this.name);
    }, 5000);
  },
  beforeDestroy() {
    clearInterval(this.interval);
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

.shell-body li .username {
  color: yellow;
}

.shell-body li:first-child:before {
  content: '>';
  position: absolute;
  left: 0;
  top: 0;
}

.shell-body li {
  word-wrap: break-word;
  position: relative;
  padding: 0 0 0 15px;
  text-align: left;

  white-space: pre-wrap;
}
</style>
