<template>
  <div>
    <list-page-top
      :breads="breads"
    />
    <v-data-table
      :headers="headers"
      :items="reporting"
      item-key="id"
      show-expand
    >
      <template #expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <div>
            <p><b>Agent:</b> {{ item.agent_name }}</p>
            <p><b>Task Command:</b></p>
            <p class="mono">
              {{ item.task }}
            </p>
            <p><b>Task Result:</b></p>
            <p class="mono">
              {{ item.results }}
            </p>
          </div>
        </td>
      </template>
      <template #item.task="{ item }">
        <span>{{ truncateMessage(item.task) }}</span>
      </template>
      <template #item.timestamp="{ item }">
        <v-tooltip top>
          <template #activator="{ on }">
            <span v-on="on">{{ moment(item.timestamp).fromNow() }}</span>
          </template>
          <span>{{ moment(item.timestamp).format('lll') }}</span>
        </v-tooltip>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import moment from 'moment';
import * as reportingApi from '@/api/reporting-api';
import ListPageTop from '@/components/ListPageTop.vue';

export default {
  name: 'Reporting',
  components: {
    ListPageTop,
  },
  data() {
    return {
      moment,
      reporting: [],
      breads: [
        {
          text: 'Reporting',
          disabled: true,
          href: '/reporting',
        },
      ],
      headers: [
        { text: 'Agent', value: 'agent_name' },
        { text: 'Task ID', value: 'taskID' },
        { text: 'Event Type', value: 'event_type' },
        { text: 'Task Command', value: 'task' },
        { text: 'User', value: 'username' },
        { text: 'Timestamp', value: 'timestamp' },
      ],
    };
  },
  mounted() {
    this.getReporting();
  },
  methods: {
    async getReporting() {
      const arr = await reportingApi.getReporting();

      // add unique ids for the expandable rows to work.
      let i = 1;
      this.reporting = arr.map((el) => ({ ...el, id: i++ }));
    },
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
