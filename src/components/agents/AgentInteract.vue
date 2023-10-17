<template>
  <div style="padding: 10px">
    <v-form ref="form" class="form" @submit.prevent.native="submit">
      <v-container>
        <v-row>
          <v-col cols="10">
            <div style="display: flex">
              <v-checkbox
                v-model="form.scriptCommand"
                class="pr-2"
                label="Script Command"
              />
              <v-tooltip bottom>
                <template #activator="{ on }">
                  <v-icon small class="pr-2" v-on="on">
                    fa-question-circle
                  </v-icon>
                </template>
                <p>{{ scriptCommand.tooltipText }}</p>
              </v-tooltip>
              <v-checkbox
                v-model="form.literal"
                class="pr-2"
                label="Literal"
                :disabled="literal.disabled"
              />
              <v-tooltip bottom>
                <template #activator="{ on }">
                  <v-icon small class="pr-2" v-on="on">
                    fa-question-circle
                  </v-icon>
                </template>
                <p>{{ literal.tooltipText }}</p>
              </v-tooltip>
              <v-text-field
                v-model="form.command"
                dense
                outlined
                label="Shell Command"
              />
            </div>
          </v-col>
          <v-col cols="2" md="2">
            <v-btn color="primary" :loading="loading" type="submit">
              Run
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-form>
  </div>
</template>

<script>
import * as agentTaskApi from "@/api/agent-task-api";

export default {
  props: {
    agent: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      loading: false,
      form: {
        command: "",
        literal: false,
        scriptCommand: false,
      },
      literal: {
        disabled: false,
        tooltipText:
          "This will ensure that aliased commands such as whoami or ps do not execute the built-in agent aliases.",
      },
      scriptCommand: {
        tooltipText:
          'Execute a script command. The function being executing should first be loading via the "Script Import" functionality.',
      },
      commands: [],
    };
  },
  watch: {
    "form.scriptCommand": {
      handler(val) {
        if (val) {
          this.form.literal = false;
          this.literal.disabled = true;
        } else {
          this.literal.disabled = false;
        }
      },
    },
  },
  methods: {
    async submit() {
      if (this.form.command.length < 1) {
        return;
      }

      this.loading = true;

      if (this.form.command.trim() === "sysinfo") {
        await agentTaskApi.sysinfo(this.agent.session_id);
      } else if (this.form.scriptCommand) {
        await agentTaskApi.scriptCommand(
          this.agent.session_id,
          this.form.command,
        );
      } else {
        await agentTaskApi.shell(
          this.agent.session_id,
          this.form.command,
          this.form.literal,
        );
      }

      this.form.command = "";
      this.loading = false;
      this.$snack.success(`Shell Command queued for ${this.agent.name}`);
    },
  },
};
</script>

<style scoped lang="scss"></style>
