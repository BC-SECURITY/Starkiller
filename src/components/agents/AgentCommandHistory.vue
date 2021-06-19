<template>
  <v-data-table
    :headers="headers"
    :items="agentResults"
    item-key="taskID"
    :sort-by.sync="sortBy"
    :sort-desc.sync="sortDesc"
    show-expand
  >
    <template #expanded-item="{ headers, item }">
      <td :colspan="headers.length">
        <div>
          <p><b>Task Command:</b></p>
          <p class="mono">
            {{ item.command }}
          </p>
          <p><b>Task Result:</b></p>
          <p class="mono">
            {{ item.results }}
          </p>
        </div>
      </td>
    </template>
    <template #item.task="{ item }">
      <span>{{ truncateMessage(item.command) }}</span>
    </template>
    <!-- <template v-slot:item.timestamp="{ item }">
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <span v-on="on">{{ moment(item.timestamp).fromNow() }}</span>
        </template>
        <span>{{ moment(item.timestamp).format('lll') }}</span>
      </v-tooltip>
    </template> -->
  </v-data-table>
</template>

<script>
import moment from 'moment';

export default {
  name: 'AgentCommandHistory',
  props: {
    agentName: {
      type: String,
      required: true,
    },
    taskResults: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      moment,
      sortBy: 'taskID',
      sortDesc: true,
      headers: [
        { text: 'Task ID', value: 'taskID' },
        { text: 'Task Command', value: 'task' },
        { text: 'User', value: 'username' },
        // { text: 'Timestamp', value: 'timestamp' },
      ],
    };
  },
  computed: {
    // todo need timestamps. newest first.
    agentResults() {
      return this.taskResults.length > 0
        ? this.taskResults : [];
    },
  },
  methods: {
    truncateMessage(task) {
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
