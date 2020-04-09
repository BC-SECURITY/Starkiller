<template>
  <div class="route-container">
    <div class="headers">
      <h3>Agents</h3>
    </div>
    <agent-viewer
      :visible="visible"
      :view="view"
      :view-object="viewObject"
      @close="close"
    />
    <el-table
      :data="agents"
      class="main-table"
      :row-class-name="tableRowClassName"
      @row-click="viewAgent"
    >
      <el-table-column
        prop="name"
        label="Name"
        sortable
        min-width="130"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        prop="checkin_time"
        label="Checkin Time"
        width="180"
        sortable
      >
        <template slot-scope="scope">
          <el-tooltip :content="moment(scope.row.checkin_time).format('lll')">
            <div>{{ moment(scope.row.checkin_time).fromNow() }}</div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        prop="hostname"
        label="Hostname"
        width="180"
        sortable
        :show-overflow-tooltip="true"
      />
      <el-table-column
        prop="process_name"
        label="Process"
        width="180"
        sortable
        :show-overflow-tooltip="true"
      />
      <el-table-column
        prop="language"
        label="Language"
        sortable
        width="140"
      />
      <el-table-column
        prop="username"
        label="Username"
        width="150"
        sortable
      />
      <el-table-column
        prop="working_hours"
        label="Working Hours"
        width="180"
      />
      <el-table-column
        fixed="right"
        label="Operations"
        width="120"
      >
        <template slot-scope="scope">
          <el-button
            type="danger"
            icon="el-icon-delete"
            label="Kill"
            circle
            size="small"
            @click="killAgent(scope.$index, agents)"
          />
        </template>
      </el-table-column>
    </el-table>
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
    this.moment = moment;
  },
  methods: {
    close() {
      this.visible = false;
      this.view = false;
      this.viewObject = {};
      this.getAgents();
    },
    tableRowClassName({ row }) {
      if (row.stale === true) {
        return 'warning-row';
      }
      return 'l';
    },
    getAgents() {
      this.$store.dispatch('agent/getAgents');
    },
    async killAgent(index, rows) {
      try {
        await this.$confirm(`Do you want to kill agent ${rows[index].name}?`);
      } catch (err) {
        return;
      }

      this.$store.dispatch('agent/killAgent', { name: rows[index].name });
      this.$notify({
        message: `Agent ${rows[index].name} tasked to run TASK_EXIT.`,
        type: 'success',
      });
      this.getAgents();
    },
    viewAgent(row, column) {
      if (column.label === 'Operations') {
        return;
      }

      this.visible = true;
      this.view = true;
      this.viewObject = row;
    },
  },
};
</script>

<style>
</style>
