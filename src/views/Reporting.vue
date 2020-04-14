<template>
  <div class="route-container">
    <div class="headers">
      <h3>Reporting</h3>
    </div>
    <el-table
      :data="reporting"
      class="main-table"
    >
      <el-table-column type="expand">
        <template slot-scope="props">
          <p><b>Agent:</b> {{ props.row.agent_name }}</p>
          <p><b>Task Command:</b></p>
          <p class="mono">
            {{ props.row.task }}
          </p>
          <p><b>Task Result:</b></p>
          <p class="mono">
            {{ props.row.results }}
          </p>
        </template>
      </el-table-column>
      <el-table-column
        prop="agent_name"
        label="Agent"
        sortable
      />
      <el-table-column
        prop="taskID"
        label="Task ID"
        sortable
      />
      <el-table-column
        prop="event_type"
        label="Event Type"
        sortable
      />
      <el-table-column
        prop="task"
        label="Task Command"
        sortable
      >
        <template slot-scope="scope">
          <div>{{ truncateMessage(scope.row) }}</div>
        </template>
      </el-table-column>
      <el-table-column
        prop="username"
        label="User"
        width="120"
        sortable
      />
      <el-table-column
        prop="timestamp"
        label="timestamp"
        width="180"
        sortable
      >
        <template slot-scope="scope">
          <el-tooltip :content="moment(scope.row.timestamp).format('lll')">
            <div>{{ moment(scope.row.timestamp).fromNow() }}</div>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import moment from 'moment';
import * as reportingApi from '@/api/reporting-api';

export default {
  name: 'Reporting',
  components: {
  },
  data() {
    return {
      reporting: [],
    };
  },
  mounted() {
    this.getReporting();
    this.moment = moment;
  },
  methods: {
    async getReporting() {
      this.reporting = await reportingApi.getReporting();
    },
    truncateMessage({ task }) {
      if (task) {
        return task.length > 30 ? `${task.substr(0, 30)}...` : task;
      }

      return '';
    },
  },
};
</script>

<style>
.mono {
  white-space: pre-wrap;
  font: 0.8em 'Andale Mono', Consolas, 'Courier New';
  line-height: 1.6em;
}
</style>
