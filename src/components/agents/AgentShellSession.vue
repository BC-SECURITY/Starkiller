<template>
  <div>
    <div class="terminal-container" data-testid="agent-shell">
      <div ref="output" class="terminal-output">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          v-for="(line, index) in outputLines"
          :key="index"
          :class="line.cssClasses"
          style="white-space: pre-wrap"
          v-html="ansiToHTML(line.content)"
        />
      </div>
      <div class="terminal-input">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span
          ref="promptSpan"
          class="prompt"
          v-html="ansiToHTML(currentPrompt)"
        />
        <input
          ref="inputField"
          v-model="currentInput"
          @keyup.enter="processCommand"
          @keydown="handleKeyEvents"
        />
      </div>
    </div>

    <TerminalSuggestions
      :suggestions="suggestions"
      :highlighted-index="currentSuggestionIndex"
      :anchor="() => ({ input: $refs.inputField, prompt: $refs.promptSpan })"
      @select="applySuggestion"
    />
  </div>
</template>

<script>
import { getCurrentInstance, watch } from "vue";
import * as agentTaskApi from "@/api/agent-task-api";
import { ansiToHtml, colorizeText } from "@/utils/ansi";
import { useTerminalOutput } from "@/composables/useTerminalOutput";
import { usePollForResult } from "@/composables/usePollForResult";
import {
  useCommandHistory,
  historyMatches,
} from "@/composables/useCommandHistory";
import TerminalSuggestions from "@/components/agents/TerminalSuggestions.vue";

export default {
  name: "AgentShellSession",
  components: { TerminalSuggestions },
  props: {
    agent: {
      type: Object,
      required: true,
    },
    tabId: {
      type: Number,
      default: null,
    },
  },
  setup(props) {
    const instance = getCurrentInstance();
    const { output, outputLines, addLine, addError, addInfo, loadHistory } =
      useTerminalOutput(() => instance.proxy.storageName());
    const { pollForResult } = usePollForResult(() => props.agent, {
      addLine,
      addInfo,
    });
    const {
      commandHistory,
      pushCommand,
      navigatePrev,
      navigateNext,
      loadCommandHistory,
    } = useCommandHistory(() => instance.proxy.historyStorageKey());
    // AgentEdit.vue can mount this component before its own agent fetch
    // resolves (it persists the active interact-tab and restores it as the
    // initial render, and Vue mounts children before the parent's mounted()
    // hook runs) -- when that happens, mounted()'s loadHistory() call reads
    // the wrong storage key (agent.session_id is still undefined) and finds
    // nothing. Retry once session_id actually arrives, so history isn't
    // silently lost on a reload while this tab happens to be the persisted
    // active one.
    watch(
      () => props.agent?.session_id,
      (sessionId, previousSessionId) => {
        if (!sessionId || sessionId === previousSessionId) return;
        // Command history reloads on ANY change of agent, not just the
        // undefined -> real one. AgentEdit renders this component without a
        // :key and swaps the agent prop when the route param changes, so on a
        // real -> real switch the instance is reused: without this, the
        // previous agent's commands stay in memory and the next push persists
        // them under the new agent's key.
        loadCommandHistory();
        if (!previousSessionId) {
          loadHistory();
          // updateCurrentDirectory() probes the agent by session_id; if it ran
          // in mounted() while session_id was still undefined (Shell mounted as
          // the persisted active tab before AgentEdit's getAgent() resolved),
          // the probe hit /agents/undefined/... and the prompt fell back to an
          // undefined directory. Re-run it here once the real session_id lands.
          instance.proxy.updateCurrentDirectory();
        }
      },
    );
    return {
      output,
      outputLines,
      addLine,
      addError,
      addInfo,
      loadHistory,
      pollForResult,
      commandHistory,
      pushCommand,
      navigatePrev,
      navigateNext,
      loadCommandHistory,
    };
  },
  data() {
    return {
      currentInput: "",
      currentDir: "loading...",
      suggestions: [],
      currentSuggestionIndex: -1,
    };
  },
  computed: {
    currentPrompt() {
      const prefix = colorizeText("(Empire: ", "white");
      const suffix = colorizeText(" )>", "white");
      const body = colorizeText(this.currentDir, "green");
      return prefix + body + suffix;
    },
  },
  watch: {
    currentInput() {
      // Any manual edit dismisses an open completion list. (Applying a
      // suggestion sets currentInput too, but the list is already cleared by
      // then, so this is a harmless no-op in that path.)
      if (this.suggestions.length) {
        this.suggestions = [];
        this.currentSuggestionIndex = -1;
      }
    },
  },
  async mounted() {
    this.$refs.inputField.focus();
    this.loadHistory();
    this.loadCommandHistory();
    // Probe only with a real session_id; the setup() watch retries otherwise.
    if (this.agent?.session_id) {
      this.updateCurrentDirectory();
    }
  },
  methods: {
    storageName() {
      const suffix = this.tabId != null ? `-${this.tabId}` : "";
      return `shell-session-${this.agent.session_id}${suffix}`;
    },
    // Null until session_id lands. mounted() runs before AgentEdit's getAgent()
    // resolves on the persisted-active-tab path, and AgentEdit passes no tabId,
    // so an unguarded key would be the literal "shell-session-undefined:history"
    // -- shared by every agent, in both directions: the initial read can pull
    // another agent's commands into this session, and anything typed in that
    // window is written where the next agent will read it. The setup() watch
    // re-loads once the real id arrives.
    historyStorageKey() {
      if (!this.agent?.session_id) return null;
      return `${this.storageName()}:history`;
    },
    handleKeyEvents(event) {
      if (event.code === "ArrowUp") {
        event.preventDefault();
        const prev = this.navigatePrev(this.currentInput);
        if (prev !== undefined) {
          this.currentInput = prev;
        }
      } else if (event.code === "ArrowDown") {
        const next = this.navigateNext();
        if (next !== undefined) {
          this.currentInput = next;
        }
      } else if (event.code === "Tab") {
        // Shift+Tab is reverse focus navigation, never completion. event.code
        // is the physical key, so it lands in this branch too.
        if (event.shiftKey) return;
        const matches = historyMatches(this.commandHistory, this.currentInput);
        // preventDefault only once there is something to complete: matching is
        // synchronous, so it still suppresses the default during keydown.
        // Swallowing Tab with no matches (or empty input) leaves a
        // keyboard-only operator no way out of an input mounted() focuses.
        if (matches.length === 1) {
          event.preventDefault();
          this.currentInput = matches[0];
          this.suggestions = [];
          this.currentSuggestionIndex = -1;
        } else if (matches.length > 1) {
          event.preventDefault();
          this.suggestions = matches;
          this.currentSuggestionIndex =
            (this.currentSuggestionIndex + 1) % matches.length;
        }
      }
    },
    applySuggestion(suggestion) {
      this.currentInput = suggestion;
      this.suggestions = [];
      this.currentSuggestionIndex = -1;
    },
    async processCommand() {
      if (this.suggestions.length > 0 && this.currentSuggestionIndex !== -1) {
        this.currentInput = this.suggestions[this.currentSuggestionIndex];
        this.suggestions = [];
        this.currentSuggestionIndex = -1;
        return;
      }

      if (!this.currentInput.trim()) {
        this.addLine("");
        this.addLine(this.currentPrompt);
        this.currentInput = "";
        return;
      }

      this.addLine(`${this.currentPrompt} ${this.currentInput}`);
      const command = this.currentInput;

      if (command.trim() === "clear") {
        this.outputLines = [];
        this.currentInput = "";
        return;
      }

      this.pushCommand(command);
      this.currentInput = "";

      await this.shellCommandOperator(command);
    },
    async shellCommandOperator(stdin) {
      let response = null;
      try {
        if (stdin.trim() === "sysinfo") {
          response = await agentTaskApi.sysinfo(this.agent.session_id);
        } else {
          response = await agentTaskApi.shell(
            this.agent.session_id,
            stdin,
            false,
          );
        }
      } catch (error) {
        this.addError(`Error executing command: ${error.message}`);
        return;
      }

      const complete = await this.pollForResult(response.id, { print: false });

      if (["cd", "set-location"].includes(stdin.toLowerCase().split(" ")[0])) {
        if (complete?.output) {
          this.addLine(complete.output, "indent-5-spaces");
        }
        this.updateCurrentDirectory();
        return;
      }

      if (complete?.output) {
        this.addLine(complete.output, "indent-5-spaces");
      }
    },
    getDirectoryCommand() {
      if (this.agent.language === "python") {
        return "echo $PWD";
      }
      if (this.agent.language === "ironpython") {
        return "cd .";
      }
      return "(Resolve-Path .\\).Path";
    },
    async updateCurrentDirectory() {
      this.currentDir = "loading...";
      try {
        const response = await agentTaskApi.shell(
          this.agent.session_id,
          this.getDirectoryCommand(),
        );

        const complete = await this.pollForResult(response.id, {
          print: false,
        });

        if (complete?.output) {
          this.currentDir = complete.output.split("\r")[0];
        } else {
          this.currentDir = this.agent.session_id;
        }
      } catch {
        this.currentDir = this.agent.session_id;
      }
    },
    ansiToHTML: ansiToHtml,
  },
};
</script>

<style lang="scss" scoped>
.terminal-container {
  font-family: "Courier New", Courier, monospace;
  font-size: 14px;
  max-height: 60vh;
  padding: 10px;
  background-color: #424242fc;
  color: white;
  border: 1px solid #57d9a3;
  border-radius: 5px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.terminal-output {
  overflow-y: auto;
}

.terminal-input {
  display: flex;
  align-items: center;
}

.terminal-input input {
  background-color: transparent;
  color: white;
  border: none;
  outline: none;
  flex: 1;
  padding-left: 5px;
}

.error-text {
  color: #ff0000;
  font-weight: bold;
  margin-right: 5px;
}

.error-text::before {
  content: "[!] ";
}

.info-text {
  color: #009dff;
  font-weight: bold;
  margin-right: 5px;
}

.info-text::before {
  content: "[*] ";
}

.prompt {
  color: #ff0000;
  font-weight: bold;
  margin-right: 5px;
}

.preserve-newlines {
  white-space: pre-line;
}

.indent-5-spaces {
  padding-left: 5ch;
  white-space: pre-wrap;
}
</style>
