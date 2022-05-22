<template>
  <div style="padding: 10px">
    <v-form
      ref="form"
      class="form"
      @submit.prevent.native="submit"
    >
      <v-container>
        <v-row>
          <v-col
            cols="8"
          >
            <div style="display: flex;">
              <v-tooltip
                bottom
              >
                <template #activator="{ on }">
                  <v-icon
                    small
                    class="pr-2"
                    v-on="on"
                  >
                    fa-question-circle
                  </v-icon>
                </template>
                <p>{{ tooltipText }}</p>
                <p>{{ tooltipText2 }}</p>
              </v-tooltip>
              <v-tooltip>
                <v-icon>
                  fa-info-circle
                </v-icon>
                <span>
                  This is the name of the agent.
                </span>
              </v-tooltip>
              <v-text-field
                v-model="form.command"
                dense
                outlined
                label="Shell Command"
              />
            </div>
          </v-col>
          <v-col
            cols="4"
            md="4"
          >
            <v-btn
              color="primary"
              :loading="loading"
              type="submit"
            >
              Run
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-form>
  </div>
</template>

<script>
import * as agentApi from '@/api/agent-api';

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
        command: '',
      },
      commands: [],
      tooltipText: "To bypass aliased commands such as 'ps', 'ipconfig', or 'whoami',",
      tooltipText2: "prefix the command with 'shell' such as shell \"whoami /groups\"",
    };
  },
  methods: {
    async submit() {
      if (this.form.command.length < 1) {
        return;
      }

      this.loading = true;
      await agentApi.shell(this.agent.name, this.form.command);
      this.form.command = '';
      this.loading = false;
      this.$snack.success(`Shell Command queued for ${this.agent.name}`);
    },
  },
};
</script>

<style scoped lang="scss">
</style>
