<template>
  <div class="agent-interact">
    <h4>Run Command</h4>
    <el-form
      :model="form"
      :inline="true"
      label-width="125px"
      class="form"
      @submit.prevent.native="submit"
    >
      <el-form-item>
        <el-autocomplete
          v-model="form.command"
          class="inline-input"
          :fetch-suggestions="querySearch"
          placeholder="Command"
          :select-when-unmatched="true"
          style="width: 350px;"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          native-type="submit"
          type="primary"
          size="mini"
        >
          Run
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
/* eslint-disable max-len */
import * as agentApi from '@/api/agent-api';

export default {
  props: {
    viewObject: {
      type: Object,
      default: () => {},
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
  mounted() {
    this.commands = this.loadAll();
  },
  methods: {
    querySearch(queryString, cb) {
      const { commands } = this;
      const results = queryString ? commands.filter(this.createFilter(queryString)) : commands;
      // call callback function to return suggestions
      cb(results);
    },
    createFilter(queryString) {
      return link => (link.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0);
    },
    loadAll() {
      // as people use the commands we could cache them in electron-store
      return [
        { value: 'whoami' },
        { value: 'pwd' },
        { value: 'ls' },
        { value: 'echo' },
      ];
    },
    submit() {
      agentApi.shell(this.viewObject.name, this.form.command);
      this.form.command = '';
    },
  },
};
</script>

<style scoped lang="scss">
.agent-interact {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form {
  max-width: 600px;
}
</style>
