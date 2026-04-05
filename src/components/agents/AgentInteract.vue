<template>
  <div style="padding: 10px">
    <v-form ref="form" class="form" @submit.prevent="submit">
      <v-text-field
        v-model="form.command"
        density="compact"
        variant="outlined"
        label="Shell Command"
      />
      <div class="d-flex align-center mb-4">
        <v-checkbox
          v-model="form.literal"
          label="Literal"
          density="compact"
          hide-details
          :disabled="literal.disabled"
        />
        <v-tooltip location="bottom">
          <template #activator="{ props: activatorProps }">
            <v-icon size="small" class="ml-1" v-bind="activatorProps">
              fa-question-circle
            </v-icon>
          </template>
          <span>{{ literal.tooltipText }}</span>
        </v-tooltip>
      </div>
      <v-btn color="primary" :loading="loading" type="submit"> Submit </v-btn>
    </v-form>
  </div>
</template>

<script>
import * as agentTaskApi from "@/api/agent-task-api";

export default {
  inject: ["snack"],
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
      },
      literal: {
        disabled: false,
        tooltipText:
          "This will ensure that aliased commands such as whoami or ps do not execute the built-in agent aliases.",
      },
      commands: [],
    };
  },
  watch: {},
  methods: {
    async submit() {
      if (this.form.command.length < 1) {
        return;
      }

      this.loading = true;
      try {
        if (this.form.command.trim() === "sysinfo") {
          await agentTaskApi.sysinfo(this.agent.session_id);
        } else {
          await agentTaskApi.shell(
            this.agent.session_id,
            this.form.command,
            this.form.literal,
          );
        }
        this.form.command = "";
        this.snack.success(`Shell Command queued for ${this.agent.name}`);
      } catch (err) {
        this.snack.error(`Error executing command: ${err}`);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped lang="scss"></style>
