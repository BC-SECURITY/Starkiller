<template>
  <div>
    <v-breadcrumbs :items="breads" />

    <div class="headers">
      <h3>Agents</h3>
    </div>
    <v-data-table
      :headers="headers"
      :items="agents"
    >
      <!-- TODO Refactor with Vuetify 2.3 like AgentExecuteModule https://github.com/vuetifyjs/vuetify/pull/11254 -->
      <!-- Use item template to apply conditional row formatting -->
      <!-- Unfortunately breaks the default "mobile view" -->
      <template v-slot:item="{ item }">
        <tr
          :class="{'warning-row': item.stale}"
          @click="viewAgent(item)"
        >
          <td>
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
          </td>
          <td>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <span v-on="on">{{ moment(item.checkin_time).fromNow() }}</span>
              </template>
              <span>{{ moment(item.checkin_time).format('lll') }}</span>
            </v-tooltip>
          </td>
          <td> {{ item.hostname }}</td>
          <td><span>{{ truncateMessage(item.process_name) }}</span></td>
          <td> {{ item.language }}</td>
          <td> {{ item.username }}</td>
          <td> {{ item.working_hours }}</td>
          <td>
            <v-icon
              small
              @click.stop="killAgent(item)"
            >
              fa-trash-alt
            </v-icon>
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import moment from 'moment';
import { mapState } from 'vuex';

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
    viewAgent(item) {
      this.$router.push({ name: 'agentEdit', params: { id: item.name } });
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

<style scoped style="scss">
.warning-row {
  background: #FFCCCC;
}

.v-data-table.theme--dark
  .warning-row {
    background: #bd4c4c;
  }
</style>
