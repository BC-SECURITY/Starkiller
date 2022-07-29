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
              <v-checkbox
                v-model="form.literal"
                class="pr-2"
                label="Literal"
              />
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
        literal: false,
      },
      commands: [],
      tooltipText: 'This will ensure that aliased commands such as whoami or ps do not execute the built-in agent aliases.',
    };
  },
  methods: {
    async submit() {
      if (this.form.command.length < 1) {
        return;
      }

      this.loading = true;

      if (this.form.command.trim() === 'sysinfo') {
        await agentApi.sysinfo(this.agent.session_id);
      } else {
        await agentApi.shell(this.agent.session_id, this.form.command, this.form.literal);
      }

      this.form.command = '';
      this.loading = false;
      this.$snack.success(`Shell Command queued for ${this.agent.name}`);
    },
  },
};
</script>

<style scoped lang="scss">
</style>
