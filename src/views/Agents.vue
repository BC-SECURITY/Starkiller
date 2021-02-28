<template>
  <div>
    <v-breadcrumbs :items="breads" />

    <div class="headers">
      <h3>Agents</h3>
    </div>
    <v-checkbox
      v-model="hideStaleAgentsCheckbox"
      label="Hide Stale Agents"
    />
    <v-data-table
      dense
      :item-class="rowClass"
      :headers="headers"
      :items="sortedAgents"
      @click:row="viewAgent"
    >
      <template v-slot:item.name="{ item }">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-icon
              v-if="item.high_integrity === 1"
              small
              v-on="on"
            >
              fa-user-cog
            </v-icon>
          </template>
          <span>Elevated Process</span>
        </v-tooltip>
        <span>{{ item.name }}</span>
      </template>
      <template v-slot:item.checkin_time="{ item }">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <span v-on="on">{{ moment(item.checkin_time).fromNow() }}</span>
          </template>
          <span>{{ moment(item.checkin_time).format('lll') }}</span>
        </v-tooltip>
      </template>
      <template v-slot:item.process_name="{ item }">
        <span>{{ truncateMessage(item.process_name) }}</span>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-icon
          class="mr-2"
          small
          @click.stop="killAgent(item)"
        >
          fa-trash-alt
        </v-icon>
        <v-icon
          small
          @click.stop="popout(item)"
        >
          fa-external-link-alt
        </v-icon>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import moment from 'moment';
import { mapState } from 'vuex';

// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcRenderer } from 'electron';

export default {
  name: 'Agents',
  components: {
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
      hideStale: false,
    };
  },
  computed: {
    ...mapState({
      agents: state => state.agent.agents,
      hideStaleAgents: state => state.application.hideStaleAgents,
    }),
    sortedAgents() {
      const sorted = this.agents.slice();
      sorted.sort((a, b) => -a.checkin_time.localeCompare(b.checkin_time));
      if (this.hideStaleAgents) {
        return sorted.filter(agent => !agent.stale);
      }
      return sorted;
    },
    hideStaleAgentsCheckbox: {
      set(val) {
        this.$store.dispatch('application/hideStaleAgents', val);
      },
      get() {
        return this.hideStaleAgents;
      },
    },
  },
  mounted() {
    this.getAgents();
  },
  methods: {
    getAgents() {
      this.$store.dispatch('agent/getAgents');
    },
    async killAgent(item) {
      if (await this.$root.$confirm('Kill Agent', `Do you want to kill agent ${item.name}?`, { color: 'red' })) {
        this.$store.dispatch('agent/killAgent', { name: item.name });
        this.$toast.success(`Agent ${item.name} tasked to run TASK_EXIT.`);
        this.getAgents();
      }
    },
    popout(item) {
      ipcRenderer.send('agentWindowOpen', { id: item.name });
    },
    viewAgent(item) {
      this.$router.push({ name: 'agentEdit', params: { id: item.name } });
    },
    truncateMessage(str) {
      if (str) {
        return str.length > 30 ? `${str.substr(0, 30)}...` : str;
      }

      return '';
    },
    rowClass(item) {
      if (item.stale) return 'warning-row';
      return '';
    },
  },
};
</script>

<style style="scss">
.warning-row {
  background-color: #FFCCCC;
}

.v-data-table.theme--dark
  .warning-row {
    background-color: #bd4c4c;
  }
</style>
