<template>
  <div class="terminal-container">
    <div ref="output" class="terminal-output">
      <div
        v-for="(line, index) in outputLines"
        :key="index"
        :class="line.cssClasses"
        style="white-space: pre-wrap"
        v-html="ansiToHTML(line.content)"
      />
    </div>
    <div class="terminal-input">
      <span class="prompt" v-html="ansiToHTML(currentPrompt)" />
      <input
        ref="inputField"
        v-model="currentInput"
        @keyup.ctrl.c.prevent.stop="ctrlCHandler"
        @keyup.enter="processCommand"
        @keydown="handleKeyEvents"
      />
    </div>
    <div
      v-show="suggestions.length"
      ref="suggestionList"
      class="autocomplete-suggestions"
    >
      <div
        v-for="(suggestion, index) in suggestions"
        :key="index"
        :class="{ highlighted: index === currentSuggestionIndex }"
        class="suggestion"
        @click="applySuggestion(suggestion)"
        @keyup.enter="applySuggestion(suggestion)"
      >
        {{ suggestion }}
      </div>
    </div>
  </div>
</template>

<script>
import pause from "@/utils/pause";
import * as moduleApi from "@/api/module-api";
import * as agentTaskApi from "@/api/agent-task-api";
import AnsiUp from "ansi_up";
import { table } from "table";
import { useModuleStore } from "@/stores/module-module";

function fuzzyMatch(query, string) {
  const q = Array.from(query);
  return Array.from(string).some((_, i, a) =>
    q.every((e, j) => e === a[i + j]),
  );
}

export default {
  name: "AgentTerminal",
  props: {
    agent: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      currentInput: "",
      outputLines: [],
      currentModule: null,
      moduleOptions: {},
      commandHistory: [],
      historyIndex: -1,
      moduleName: "",
      currentOptions: {},
      suggestions: [],
      currentSuggestionIndex: -1,
      tableConfig: {
        border: {
          topBody: "─",
          topJoin: "┬",
          topLeft: "┌",
          topRight: "┐",

          bottomBody: "─",
          bottomJoin: "┴",
          bottomLeft: "└",
          bottomRight: "┘",

          bodyLeft: "│",
          bodyRight: "│",
          bodyJoin: "│",

          joinBody: "─",
          joinLeft: "├",
          joinRight: "┤",
          joinJoin: "┼",
        },
      },
      helpCommands: [
        {
          command: "help",
          description: "Display the help menu for the current menu",
          usage: "help",
        },
        {
          command: "clear",
          description: "Clear the terminal output.",
          usage: "clear",
        },
        {
          command: "back",
          description: "Return to the main menu from a module.",
          usage: "back",
        },
        {
          command: "usemodule",
          description: "Use a specific module by name.",
          usage: "usemodule <module_name>",
        },
        {
          command: "whoami",
          description: "Display current user.",
          usage: "whoami",
        },
        {
          command: "sysinfo",
          description: "Tasks the specified agent to update sysinfo.",
          usage: "sysinfo",
        },
        {
          command: "shell",
          description: "Tasks the specified agent to execute a shell command.",
          usage: "shell [--literal / -l] <shell_cmd>",
        },
        {
          command: "ps",
          description: "Display the processes running on the agent's system.",
          usage: "ps",
        },
        {
          command: "sc",
          description:
            "Run the powershell_collection_screenshot module with Ratio set to 80.",
          usage: "sc",
        },
        {
          command: "sherlock",
          description:
            "PowerShell script to quickly find missing software patches for local privilege escalation vulnerabilities.",
          usage: "sherlock",
        },
        {
          command: "socks",
          description: "Create a SOCKS proxy on the specified port",
          usage: "socks 1080",
        },
        {
          command: "revtoself",
          description: "Revert to self on the existing Agent",
          usage: "revtoself",
        },
        {
          command: "sleep",
          description:
            "Tasks specified agent to update delay (s) and jitter (0.0 - 1.0).",
          usage: "sleep <delay> <jitter>",
        },
      ],
      moduleHelpCommands: [
        {
          command: "execute",
          description: "Execute the selected module",
          usage: "execute",
        },
        {
          command: "generate",
          description: "Generate the selected module",
          usage: "generate",
        },
        {
          command: "help",
          description: "Display the help menu for the current menu",
          usage: "help",
        },
        {
          command: "info",
          description: "Print default info on the current record.",
          usage: "info",
        },
        {
          command: "options",
          description: "Print the current record options",
          usage: "options",
        },
        {
          command: "set",
          description: "Set a field for the current record.",
          usage: "set <key> <value>",
        },
        {
          command: "unset",
          description: "Unset a record option",
          usage: "unset <key>",
        },
        {
          command: "clear",
          description: "Clear the terminal output.",
          usage: "clear",
        },
        {
          command: "back",
          description: "Return to the main menu from a module.",
          usage: "back",
        },
      ],
      isShellMenu: false,
      currentDir: "loading...",
    };
  },
  computed: {
    moduleStore() {
      return useModuleStore();
    },
    allModules() {
      return this.moduleStore.modules;
    },
    currentPrompt() {
      const prefix = this.colorizeText("(Empire: ", "white");
      const suffix = this.colorizeText(" )>", "white");
      let body = "";
      if (this.currentModule) {
        body = this.colorizeText(`usemodule/${this.currentModule.id}`, "red");
      } else if (this.isShellMenu) {
        body = this.colorizeText(this.currentDir, "green");
      } else {
        body = this.colorizeText(this.agent.session_id, "red");
      }
      return prefix + body + suffix;
    },
  },
  watch: {
    currentInput(val) {
      if (val) {
        this.generateSuggestions();
      }
    },
    outputLines(val) {
      localStorage.setItem(this.storageName(), JSON.stringify(val));
    },
  },
  async mounted() {
    // Autofocus on the input field
    this.$refs.inputField.focus();
    if (this.allModules?.length === 0) {
      await this.moduleStore.getModules();
    }

    // Load the command history from local storage
    const savedHistory = localStorage.getItem(this.storageName());
    if (savedHistory) {
      this.outputLines = JSON.parse(savedHistory);
    }

    this.scrollToBottom();
  },
  methods: {
    storageName() {
      return `terminal-history-${this.agent.session_id}`;
    },
    ctrlCHandler(_event) {
      if (this.isShellMenu) {
        this.isShellMenu = false;
      }
      this.addLine(`${this.currentPrompt} ${this.currentInput}`);
      this.currentInput = "";
    },
    applySuggestion(suggestion) {
      this.currentInput = suggestion;
      this.suggestions = [];
      this.currentSuggestionIndex = 0;
    },
    handleKeyEvents(event) {
      if (event.code === "ArrowUp") {
        event.preventDefault(); // Prevent cursor from moving to beginning of input
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.currentInput = this.commandHistory[this.historyIndex];
        }
      } else if (event.code === "ArrowDown") {
        if (this.historyIndex < this.commandHistory.length - 1) {
          this.historyIndex++;
          this.currentInput = this.commandHistory[this.historyIndex];
        }
      } else if (event.code === "Tab") {
        if (this.currentInput === "") {
          this.generateSuggestions();
        }
        event.preventDefault();
        if (this.suggestions.length > 1) {
          this.currentSuggestionIndex =
            (this.currentSuggestionIndex + 1) % this.suggestions.length;
        } else if (this.suggestions.length === 1) {
          this.currentInput = this.suggestions[0];
          this.suggestions = [];
        }

        // This scrolls the suggestion list if the highlighted element is not visible
        this.$nextTick(() => {
          const listElement = this.$refs.suggestionList;
          const highlightedElement =
            listElement.children[this.currentSuggestionIndex];

          if (highlightedElement) {
            if (
              highlightedElement.offsetTop + highlightedElement.clientHeight >
              listElement.clientHeight
            ) {
              listElement.scrollTop =
                highlightedElement.offsetTop +
                highlightedElement.clientHeight -
                listElement.clientHeight;
            } else if (highlightedElement.offsetTop < listElement.scrollTop) {
              listElement.scrollTop = highlightedElement.offsetTop;
            }
          }
        });
      } else if (event.code === "Space") {
        if (this.currentSuggestionIndex !== -1) {
          event.preventDefault();
          this.currentInput = this.suggestions[this.currentSuggestionIndex];
          this.suggestions = [];
          this.currentSuggestionIndex = -1;
        }
      }
    },
    generateSuggestions() {
      if (this.isShellMenu) {
        if (this.suggestions.length > 0) this.suggestions = [];
        return;
      }
      const query = this.currentInput.toLowerCase().trim();

      const queryParts = query.split(" ");
      let moduleSuggestions = [];
      let commandSuggestions = [];

      if (query.startsWith("usemodule")) {
        const partialModuleName = query.replace("usemodule", "").trim();
        const matchingModules = this.allModules.filter((module) =>
          fuzzyMatch(partialModuleName, module.id.toLowerCase()),
        );
        moduleSuggestions = matchingModules.map(
          (module) => `usemodule ${module.id}`,
        );
      }
      if (this.currentModule) {
        if (queryParts[0] === "set" || queryParts[0] === "unset") {
          moduleSuggestions = Object.keys(this.moduleOptions)
            .filter(
              (option) =>
                option !== "Agent" &&
                fuzzyMatch(
                  (queryParts[1] || "").toLowerCase(),
                  option.toLowerCase(),
                ),
            )
            .map((option) => `${queryParts[0]} ${option}`);
        }
        commandSuggestions = this.moduleHelpCommands
          .map((cmd) => cmd.command.toLowerCase())
          .filter((command) => fuzzyMatch(query, command))
          .map((command) => command);
      } else {
        commandSuggestions = this.helpCommands
          .map((cmd) => cmd.command.toLowerCase())
          .filter((command) => fuzzyMatch(query, command))
          .map((command) => command);
      }

      this.suggestions = [
        ...new Set([...moduleSuggestions, ...commandSuggestions]),
      ];
    },
    processCommand() {
      // If the suggestion list is open, then apply the suggestion instead of processing the command
      if (this.suggestions.length > 0 && this.currentSuggestionIndex !== -1) {
        this.currentInput = this.suggestions[this.currentSuggestionIndex];
        this.suggestions = [];
        this.currentSuggestionIndex = -1;
        return;
      }

      // Check if the input is empty and just add an empty line if so
      if (!this.currentInput.trim()) {
        this.addLine("");
        this.addLine(this.currentPrompt);
        this.currentInput = "";
        return;
      }

      // Clear the suggestions
      this.suggestions = [];

      // First, display the current input in the terminal with the prompt
      this.addLine(`${this.currentPrompt} ${this.currentInput}`);
      const commandParts = this.currentInput.split(" ");
      const command = commandParts[0];
      const args = commandParts.slice(1);

      if (this.isShellMenu) {
        this.shellCommandOperator(this.currentInput);
      } else if (command === "back") {
        if (this.currentModule) {
          this.currentModule = null;
        } else {
          this.addLine("Already at the main menu.");
        }
      } else if (this.currentInput === "options") {
        if (this.currentModule) {
          this.displayAllOptionValues();
        } else {
          this.addLine("No module is currently selected.");
        }
      } else if (
        this.currentModule &&
        Object.keys(this.moduleOptions).includes(this.currentInput)
      ) {
        this.displayOptionValue(this.currentInput);
      } else if (!this.currentModule) {
        switch (command) {
          case "whoami":
            this.runShellCommand("whoami");
            break;
          case "usemodule":
            this.useModule(args[0]);
            break;
          case "sysinfo":
            this.getSysInfo();
            break;
          case "shell":
            if (args.length < 1) {
              this.isShellMenu = true;
              this.updateCurrentDirectory();
              this.addInfo(`Shell session started on ${this.agent.session_id}`);
              this.addInfo("Exit shell menu with Ctrl+C.");
            } else {
              this.runShellCommand(commandParts.slice(1).join(" "));
            }
            break;
          case "ps":
            this.runShellCommand("ps");
            break;
          case "sc":
            this.executeScreenshotModule();
            break;
          case "set":
            this.setModuleOption(args[0], args.slice(1).join(" "));
            break;
          case "sherlock":
            this.executeSherlockModule();
            break;
          case "revtoself":
            this.executeRevToSelfModule();
            break;
          case "execute":
            this.executeCurrentModule();
            break;
          case "socks":
            if (this.agent.language === "ironpython") {
              // Use port 1080 as a default if no argument is provided
              const port = args.length > 0 ? args[0] : 1080;
              // Execute the SOCKS proxy for IronPython agent
              agentTaskApi
                .createSocksProxy(this.agent.session_id, port)
                .then(() => {
                  this.addInfo(`SOCKS proxy created on port ${port}`);
                })
                .catch((error) => {
                  this.addError(`Error creating SOCKS proxy: ${error.message}`);
                });
            } else {
              this.addError(
                "Use Invoke-Socks Proxy module for non-Ironpython Agents.",
              );
            }
            break;
          case "sleep":
            if (args.length < 2) {
              this.addError("Invalid command. Usage: sleep <delay> <jitter>");
            } else {
              const [delay, jitter] = args;
              agentTaskApi.updateSleep(this.agent.session_id, delay, jitter);
              this.addLine(
                `Tasked agent to sleep delay/jitter ${delay}/${jitter}`,
              );
            }
            break;
          default:
            switch (this.currentInput) {
              case "help":
                this.displayHelpMenu();
                break;
              case "clear":
                this.outputLines = [];
                break;
              default:
                this.addError(`Command '${this.currentInput}' not found.`);
                break;
            }
        }
      } else {
        // Module-specific commands
        switch (command) {
          case "set":
            this.setModuleOption(args[0], args.slice(1).join(" "));
            break;
          case "execute":
            this.executeCurrentModule();
            break;
          case "unset":
            this.unsetModuleOption(args[0]);
            break;
          case "generate":
            this.executeCurrentModule();
            break;
          default:
            switch (this.currentInput) {
              case "help":
                this.displayHelpMenu();
                break;
              case "clear":
                this.outputLines = [];
                break;
              default:
                this.addError(`Command '${this.currentInput}' not found.`);
                break;
            }
        }
      }
      // Store command in history
      if (this.currentInput.trim()) {
        this.commandHistory.push(this.currentInput);
        this.historyIndex = this.commandHistory.length;
      }
      this.currentInput = "";
    },
    unsetModuleOption(optionName) {
      if (!this.currentModule) {
        this.addError("No module is currently selected.");
        return;
      }
      if (!this.moduleOptions[optionName]) {
        this.addError(
          `Option "${optionName}" not found in module ${this.currentModule.name}.`,
        );
        return;
      }
      this.moduleOptions[optionName].value = null;
      this.addInfo(`Unset ${optionName}.`);
    },
    async executeRevToSelfModule() {
      try {
        const agentName = this.agent.session_id;
        const task = await moduleApi.executeModule(
          "powershell_credentials_tokens",
          {
            RevToSelf: true,
            Agent: agentName,
          },
          false,
          false,
        );

        this.pollForResult(task.id);
        this.addInfo("RevToSelf module executed");
      } catch (error) {
        this.addError(`Error executing command: ${error.message}`);
      }
    },
    async executeSherlockModule() {
      try {
        const agentName = this.agent.session_id;
        const task = await moduleApi.executeModule(
          "powershell_privesc_sherlock",
          {
            Agent: agentName,
          },
          false,
          false,
        );

        this.pollForResult(task.id);
        this.addInfo("Sherlock module executed");
      } catch (error) {
        this.addError(`Error executing command: ${error.message}`);
      }
    },
    async runShellCommand(command) {
      if (!this.agent || !this.agent.session_id) {
        this.addError("Error: agent data is not available.");
        return;
      }

      const isLiteral =
        command.startsWith("--literal") || command.startsWith("-l");
      if (isLiteral) {
        command = command.replace("--literal", "").replace("-l", "").trim();
      }
      try {
        const task = await agentTaskApi.shell(
          this.agent.session_id,
          command,
          isLiteral,
        );
        this.pollForResult(task.id);
      } catch (error) {
        this.addError(`Error executing command: ${error.message}`);
      }
    },
    async pollForResult(
      taskId,
      config = { print: true, attempts: 30, delay: 5000 },
    ) {
      if (!config.attempts) config.attempts = 30;
      if (!config.delay)
        config.delay =
          this.agent.delay != null ? this.agent.delay * 1000 : 5000;

      let res = null;
      let hasPrintedJobStarted = false;
      let i = 0;
      let complete = false;
      while (i < config.attempts) {
        // eslint-disable-next-line no-await-in-loop
        res = await this.checkTaskComplete(taskId);
        if (res) {
          if (!res.toLowerCase().includes("job started")) {
            if (config.print) {
              this.addLine(res, "indent-5-spaces");
            }
            complete = true;
            break;
          } else if (!hasPrintedJobStarted) {
            // Print 'Job Started' only once
            this.addLine(res, "indent-5-spaces");
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
      const response = await agentTaskApi.shell(
        this.agent.session_id,
        this.getDirectoryCommand(),
      );

      const complete = await this.pollForResult(response.id, { print: false });

      if (complete) {
        // eslint-disable-next-line prefer-destructuring
        this.currentDir = (await this.checkTaskComplete(response.id)).split(
          "\r",
        )[0];
      }
    },
    // This is for when in the shell menu.
    // The other function is for when not in the shell menu.
    async shellCommandOperator(stdin) {
      let response = null;
      if (stdin.trim() === "sysinfo") {
        response = await agentTaskApi.sysinfo(this.agent.session_id);
      } else {
        response = await agentTaskApi.shell(
          this.agent.session_id,
          stdin,
          false,
        );
      }

      const complete = await this.pollForResult(response.id, { print: false });

      if (["cd", "set-location"].includes(stdin.toLowerCase().split(" ")[0])) {
        this.updateCurrentDirectory();
        return;
      }

      if (complete) {
        this.addLine(complete, "indent-5-spaces");
      }
    },
    async checkTaskComplete(taskId) {
      try {
        const task = await agentTaskApi.getTask(this.agent.session_id, taskId);
        if (task.output) {
          return task.output;
        }

        return false;
      } catch (err) {
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
    displayTable(tableText) {
      tableText.split("\n").forEach((line) => {
        this.addLine(line, "indent-5-spaces");
      });
    },
    ansiToHTML(input) {
      let output = input;
      const ansiUp = new AnsiUp();

      output = ansiUp.ansi_to_html(output);
      return output;
    },
    async useModule(moduleName) {
      const moduleData = this.allModules.find(
        (module) => module.id === moduleName,
      );

      if (!moduleData) {
        this.addError(`Module with name '${moduleName}' not found.`);
        return;
      }

      this.currentModule = moduleData;
      this.moduleOptions = moduleData.options || {};
      this.currentOptions = { ...this.moduleOptions };

      this.addLine(
        `${this.colorizeText("Module:", "green")} ${moduleData.name}`,
        "indent-5-spaces",
      );
      this.addLine(
        `${this.colorizeText("Description:", "green")} ${
          moduleData.description
        }`,
        "indent-5-spaces",
      );
      this.displayModuleOptions();
    },
    displayModuleOptions() {
      this.moduleOptions.Agent.value = this.agent.session_id;

      const modifiedConfig = {
        ...this.tableConfig,
        columns: { 1: { width: 20 }, 2: { width: 8 }, 3: { width: 40 } },
      };
      const tableData = [
        [
          this.colorizeText("Option Name", "green"),
          this.colorizeText("Value", "green"),
          this.colorizeText("Required", "green"),
          this.colorizeText("Description", "green"),
        ],
      ];

      Object.entries(this.moduleOptions).forEach(([optionName, optionData]) => {
        if (optionName !== "Agent") {
          tableData.push([
            optionName,
            optionData.value,
            optionData.required,
            optionData.description,
          ]);
        }
      });

      const output = table(tableData, modifiedConfig);
      this.displayTable(output);
      this.addInfo('Use "set <option_name> <value>" to set an option value.');
    },
    displayOptionValue(optionName) {
      const option = this.moduleOptions[optionName];
      const value = option && option.value ? option.value : "N/A";
      this.addLine(`${this.colorizeText(optionName, "green")}: ${value}`);
    },
    displayAllOptionValues() {
      Object.keys(this.currentOptions).forEach((optionName) => {
        this.displayOptionValue(optionName);
      });
    },
    setModuleOption(optionName, value) {
      if (!this.currentModule) {
        this.addError("No module is currently selected.");
        return;
      }
      if (!this.moduleOptions[optionName]) {
        this.addError(
          `Option "${optionName}" not found in module ${this.currentModule.name}.`,
        );
        return;
      }
      if (optionName === "Agent") {
        this.addError("Error: Cannot set the Agent option.");
        return;
      }
      this.moduleOptions[optionName].value = value;
      this.addInfo(`Set ${optionName} to ${value}.`);
    },
    async executeCurrentModule() {
      if (!this.currentModule) {
        this.addError("No module is currently selected.");
        return;
      }

      const missingOptions = Object.entries(this.moduleOptions)
        .filter(([_, option]) => option.required && !option.value)
        .map(([optionName, _]) => optionName);
      if (missingOptions.length > 0) {
        this.addError(`Missing required options: ${missingOptions.join(", ")}`);
        return;
      }

      this.addInfo(`Executing module ${this.currentModule.name}...`);
      try {
        const transformedOptions = Object.entries(this.moduleOptions).reduce(
          (acc, [key, option]) => {
            acc[key] = option.value;
            return acc;
          },
          {},
        );
        let task;
        try {
          task = await moduleApi.executeModule(
            this.currentModule.id,
            transformedOptions,
            false,
            false,
          );
        } catch (error) {
          this.addError(`Error executing module: ${error.error}`);
          return;
        }
        this.currentModule = null;
        this.moduleOptions = {};
        this.pollForResult(task.id);
      } catch (error) {
        this.addError(`Error executing module: ${error.message}`);
      }
    },
    async getSysInfo() {
      const task = await agentTaskApi.sysinfo(this.agent.session_id);
      this.pollForResult(task.id);
    },
    displayHelpMenu() {
      if (this.currentModule) {
        this.helpCommands = this.moduleHelpCommands;
      }

      const modifiedConfig = {
        ...this.tableConfig,
        columns: { 1: { width: 40 }, 2: { width: 30 } },
      };
      const tableData = [
        [
          this.colorizeText("Command", "green"),
          this.colorizeText("Description", "green"),
          this.colorizeText("Usage", "green"),
        ],
      ];

      this.helpCommands.forEach((command) => {
        tableData.push([command.command, command.description, command.usage]);
      });
      this.displayTable(table(tableData, modifiedConfig));
    },
    colorizeText(text, color = "") {
      let colorCode = "";
      const boldCode = "\u001b[1m";
      switch (color.toLowerCase()) {
        case "red":
          colorCode = "\u001b[91m";
          break;
        case "green":
          colorCode = "\u001b[92m";
          break;
        case "blue":
          colorCode = "\u001b[94m";
          break;
        case "yellow":
          colorCode = "\u001b[93m";
          break;
        case "white":
          colorCode = "\u001b[97m";
          break;
        default:
          return text;
      }
      return `${boldCode}${colorCode}${text}\u001b[0m`;
    },
    async executeScreenshotModule() {
      try {
        const agentName = this.agent.session_id;
        const task = await moduleApi.executeModule(
          "powershell_collection_screenshot",
          {
            Ratio: 80,
            Agent: agentName,
          },
          false,
          false,
        );

        this.pollForResult(task.id);
        this.addInfo("Screenshot saved to downloads");
      } catch (error) {
        this.addError(`Error executing command: ${error.message}`);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.terminal-container {
  font-family: "Courier New", Courier, monospace;
  font-size: 14px;
  max-height: 55vh;
  padding: 10px;
  background-color: #424242fc;
  color: white;
  border: 1px solid #57d9a3;
  overflow: auto;
}

.terminal-output {
  max-height: 50vh;
  overflow-y: auto;
}

.terminal-input {
  display: flex;
}

.terminal-input input {
  background-color: transparent;
  color: white;
  border: none;
  outline: none;
  flex: 1;
}

.error-text {
  color: #ff0000; /* ANSI red */
  font-weight: bold;
  margin-right: 5px;
}
.error-text::before {
  content: "[!] ";
}

.info-text {
  color: #009dff; /* ANSI red */
  font-weight: bold;
  margin-right: 5px;
}
.info-text::before {
  content: "[*] ";
}

.prompt {
  color: #ff0000; /* ANSI red */
  font-weight: bold; /* make text bold */
  margin-right: 5px;
}

.autocomplete-suggestions {
  position: absolute;
  background-color: #3c3f43;
  border: 1px solid #57d9a3;
  border-radius: 5px;
  z-index: 1;
  max-height: 150px;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
  padding: 5px;
  margin-top: 5px;
  margin-bottom: 5px;
}

.suggestion {
  padding: 5px 10px;
  cursor: pointer;
}

.suggestion:hover {
  background-color: #3c3f43;
}

.empire-text {
  color: white;
}

.preserve-newlines {
  white-space: pre-line;
}

.indent-5-spaces {
  padding-left: 5ch;
  white-space: pre-wrap;
}

.highlighted {
  background-color: #007bff;
  color: white;
}
</style>
