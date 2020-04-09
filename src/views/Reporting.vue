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
          <p>Sender: {{ props.row.agentname }}</p>
          <p>Message: {{ props.row.message.message }}</p>
          <p>Timestamp: {{ props.row.timestamp }}</p>
          <p>Task ID: {{ props.row.taskID }}</p>
        </template>
      </el-table-column>
      <el-table-column
        prop="ID"
        label="id"
        width="80"
        sortable
      />
      <el-table-column
        prop="agentname"
        label="Sender"
        sortable
      />
      <el-table-column
        prop="event_type"
        label="Event Type"
        sortable
      />
      <el-table-column
        prop="message.message"
        label="Message"
        sortable
      >
        <template slot-scope="scope">
          <div>{{ truncateMessage(scope.row) }}</div>
        </template>
      </el-table-column>
      <el-table-column
        prop="taskID"
        label="Task ID"
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
    truncateMessage({ message }) {
      if (message.message) {
        return message.message.length > 30 ? `${message.message.substr(0, 30)}...` : message.message;
      }

      return '';
    },
  },
};
</script>

<style>

</style>
