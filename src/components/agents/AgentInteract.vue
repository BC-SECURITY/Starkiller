<template>
  <div style="padding: 10px">
    <v-form
      ref="form"
      class="form"
    >
      <v-container>
        <v-row>
          <v-col
            cols="8"
            md="4"
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
              type="submit"
              color="primary"
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
      form: {
        command: '',
      },
      commands: [],
    };
  },
  methods: {
    submit() {
      agentApi.shell(this.agent.name, this.form.command);
      this.form.command = '';
    },
  },
};
</script>

<style scoped lang="scss">
</style>
