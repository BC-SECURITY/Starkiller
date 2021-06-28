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
            <v-text-field
              v-model="form.command"
              dense
              outlined
              label="Shell Command"
            />
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
