<template>
  <div>
    <div class="terminal-container">
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
        <span class="prompt" v-html="ansiToHTML(currentPrompt)" />
        <input
          ref="inputField"
          v-model="currentInput"
          @keyup.enter="processCommand"
          @keydown="handleKeyEvents"
        />
      </div>
    </div>
  </div>
</template>

<script>
import pause from "@/utils/pause";
import * as agentTaskApi from "@/api/agent-task-api";
import AnsiUp from "ansi_up";

export default {
  name: "AgentShellSession",
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
  data() {
    return {
      currentInput: "",
      outputLines: [],
      commandHistory: [],
      historyIndex: -1,
      currentDir: "loading...",
    };
  },
  computed: {
    currentPrompt() {
      const prefix = this.colorizeText("(Empire: ", "white");
      const suffix = this.colorizeText(" )>", "white");
      const body = this.colorizeText(this.currentDir, "green");
      return prefix + body + suffix;
    },
  },
  watch: {
    outputLines(val) {
      try {
        const toStore = val.length > 500 ? val.slice(-500) : val;
        localStorage.setItem(this.storageName(), JSON.stringify(toStore));
      } catch {
        // localStorage quota exceeded — ignore
      }
    },
  },
  async mounted() {
    this.$refs.inputField.focus();

    try {
      const savedHistory = localStorage.getItem(this.storageName());
      if (savedHistory) {
        this.outputLines = JSON.parse(savedHistory);
      }
    } catch {
      localStorage.removeItem(this.storageName());
    }

    this.scrollToBottom();
    this.updateCurrentDirectory();
  },
  methods: {
    storageName() {
      const suffix = this.tabId != null ? `-${this.tabId}` : "";
      return `shell-session-${this.agent.session_id}${suffix}`;
    },
    handleKeyEvents(event) {
      if (event.code === "ArrowUp") {
        event.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.currentInput = this.commandHistory[this.historyIndex];
        }
      } else if (event.code === "ArrowDown") {
        if (this.historyIndex < this.commandHistory.length - 1) {
          this.historyIndex++;
          this.currentInput = this.commandHistory[this.historyIndex];
        }
      }
    },
    async processCommand() {
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

      this.commandHistory.push(command);
      this.historyIndex = this.commandHistory.length;
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
    async pollForResult(
      taskId,
      config = { print: true, attempts: 30, delay: 5000 },
    ) {
      if (!config.attempts) config.attempts = 30;
      config.delay = Math.max(
        config.delay ||
          (this.agent.delay != null ? this.agent.delay * 1000 : 5000),
        1000,
      );

      let res = null;
      let hasPrintedJobStarted = false;
      let i = 0;
      let complete = false;
      while (i < config.attempts) {
        // eslint-disable-next-line no-await-in-loop
        res = await this.checkTaskComplete(taskId);
        if (res) {
          const { output } = res;
          if (!output.toLowerCase().includes("job started")) {
            if (config.print) {
              const taskName = res.module_name || res.task_name || "shell";
              this.addLine(
                `[*] Task ${res.id} (${taskName}) completed`,
                "info-text",
              );
              this.addLine(output, "indent-5-spaces");
            }
            complete = true;
            break;
          } else if (!hasPrintedJobStarted) {
            this.addLine(output, "indent-5-spaces");
            hasPrintedJobStarted = true;
          }
        }

        // eslint-disable-next-line no-await-in-loop
        await pause(config.delay);
        i++;
      }

      if (!complete) {
        this.addInfo(`No output received for task ${taskId}.`);
      }

      return res;
    },
    async checkTaskComplete(taskId) {
      try {
        const task = await agentTaskApi.getTask(this.agent.session_id, taskId);
        if (task.output) {
          return task;
        }
        return false;
      } catch (_err) {
        return false;
      }
    },
    addLine(content, cssClasses = "preserve-newlines") {
      this.outputLines.push({ content, cssClasses });
      this.scrollToBottom();
    },
    addError(content) {
      this.addLine(content, "error-text");
    },
    addInfo(content) {
      this.addLine(content, "info-text");
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const outputDiv = this.$refs.output;
        outputDiv.scrollTop = outputDiv.scrollHeight;
      });
    },
    ansiToHTML(input) {
      const converter = new AnsiUp();
      return converter.ansi_to_html(input);
    },
    colorizeText(text, color = "") {
      const ansiColors = {
        red: "\u001b[91m",
        green: "\u001b[92m",
        blue: "\u001b[94m",
        yellow: "\u001b[93m",
        white: "\u001b[97m",
      };
      const colorCode = ansiColors[color.toLowerCase()];
      if (!colorCode) return text;
      return `\u001b[1m${colorCode}${text}\u001b[0m`;
    },
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
