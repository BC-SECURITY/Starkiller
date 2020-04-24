<template>
  <div class="route-container">
    <v-breadcrumbs :items="breads" />

    <div class="headers">
      <h3>Agents</h3>
    </div>
    <v-data-table
      :headers="headers"
      :items="agents"
      @click:row="viewAgent"
    >
      <template v-slot:item.name="{ item }">
        <v-icon
          v-if="item.high_integrity === 1"
          small
        >
          fa-user-cog
        </v-icon>
        {{ item.name }}
      </template>
      <template v-slot:item.process_name="{ item }">
        <span>{{ truncateMessage(item.process_name) }}</span>
      </template>
      <template v-slot:item.checkin_time="{ item }">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <span v-on="on">{{ moment(item.checkin_time).fromNow() }}</span>
          </template>
          <span>{{ moment(item.checkin_time).format('lll') }}</span>
        </v-tooltip>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-icon
          small
          @click.stop="killAgent(item)"
        >
          fa-trash-alt
        </v-icon>
      </template>
    </v-data-table>
    <agent-viewer
      :visible="visible"
      :view="view"
      :view-object="viewObject"
      @close="close"
    />
  </div>
</template>

<script>
import moment from 'moment';
import { mapState } from 'vuex';
import AgentViewer from '@/components/agents/AgentViewer.vue';

export default {
  name: 'Agents',
  components: {
    AgentViewer,
  },
  data() {
    return {
      breads: [
        {
          text: 'Agents',
          disabled: true,
          href: '/agents',
        },
      ],
      headers: [
        { text: 'Name', value: 'name' },
        { text: 'Check-in Time', value: 'checkin_time' },
        { text: 'Hostname', value: 'hostname' },
        { text: 'Process', value: 'process_name' },
        { text: 'Language', value: 'language' },
        { text: 'Username', value: 'username' },
        { text: 'Working Hours', value: 'working_hours' },
        { text: 'Actions', value: 'actions' },
      ],
      moment,
      visible: false,
      view: false,
      viewObject: {},
    };
  },
  computed: {
    ...mapState({
      agents: state => state.agent.agents,
    }),
  },
  mounted() {
    this.getAgents();
  },
  methods: {
    close() {
      this.visible = false;
      this.view = false;
      this.viewObject = {};
      this.getAgents();
    },
    getAgents() {
      this.$store.dispatch('agent/getAgents');
    },
    async killAgent(item) {
      try {
        await this.$confirm(`Do you want to kill agent ${item.name}?`);
      } catch (err) {
        return;
      }

      this.$store.dispatch('agent/killAgent', { name: item.name });
      this.$notify({
        message: `Agent ${item.name} tasked to run TASK_EXIT.`,
        type: 'success',
      });
      this.getAgents();
    },
    viewAgent(item) {
      this.visible = true;
      this.view = true;
      this.viewObject = item;
    },
    truncateMessage(str) {
      if (str) {
        return str.length > 30 ? `${str.substr(0, 30)}...` : str;
      }

      return '';
    },
  },
};
</script>

<style>
</style>
