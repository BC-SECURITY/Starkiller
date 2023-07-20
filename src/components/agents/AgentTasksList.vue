<template>
  <div>
    <list-page-top
      v-if="active"
      :breads="breads"
      :show-create="false"
      :show-refresh="true"
      :show-delete="false"
      @refresh="getTasks"
    />
    <div style="display: flex; flex-direction: row;">
      <v-card
        class="mr-2 pa-2"
        elevation="2"
        outlined
        style="width:300px;"
      >
        <v-expansion-panels
          class="mb-6"
          multiple
        >
          <v-expansion-panel>
            <v-expansion-panel-header expand-icon="mdi-menu-down">
              Search
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-text-field
                v-model="search"
                label="Search"
                outlined
                dense
                required
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel v-if="!agent">
            <v-expansion-panel-header expand-icon="mdi-menu-down">
              Agents
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-checkbox
                v-model="selectedAllAgents"
                x-small
                dense
                label="Select All"
              />
              <v-divider class="pb-4" />
              <v-checkbox
                v-for="agent in agents"
                :key="agent.session_id"
                v-model="selectedAgents"
                :value="agent.session_id"
                x-small
                dense
                :label="agent.name"
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-header expand-icon="mdi-menu-down">
              Users
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-checkbox
                v-model="selectedAllUsers"
                x-small
                dense
                label="Select All"
              />
              <v-divider class="pb-4" />
              <v-checkbox
                v-for="user in users"
                :key="user.id"
                v-model="selectedUsers"
                :value="user.id"
                x-small
                dense
                :label="user.username"
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
      <v-card
        style="flex-grow: 1;"
        elevation="2"
        outlined
      >
        <agent-tasks-table
          ref="agentTaskTable"
          :agent="agent"
          :refresh-tasks="refreshTasks"
          :hide-columns="['id', 'task_name']"
          :selected-agents="selectedAgents"
          :selected-users="selectedUsers"
          :search="search"
        />
      </v-card>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import debounce from 'lodash.debounce';
import { mapState } from 'vuex';

import AgentTasksTable from '@/components/agents/AgentTasksTable.vue';
import ListPageTop from '@/components/ListPageTop.vue';
import DownloadMixin from '@/mixins/download-stager';

export default {
  name: 'AgentTasksList',
  components: {
    AgentTasksTable,
    ListPageTop,
  },
  mixins: [DownloadMixin],
  props: {
    agent: {
      type: Object,
      required: false,
      default: null,
    },
    refreshTasks: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      breads: [
        {
          text: 'Agents',
          disabled: true,
          href: '/agents',
        }, {
          text: 'Tasks',
          disabled: true,
          href: '/agents?tab=tasks',
        },
      ],
      tasks: [],
      search: '',
      loading: false,
      moment,
      selectedAgents: [],
      selectedUsers: [],
    };
  },
  computed: {
    ...mapState({
      agents: (state) => state.agent.agents,
      users: (state) => state.user.users,
    }),
    selectedAllAgents: {
      set(val) {
        if (val) {
          this.selectedAgents = this.agents.map((a) => a.session_id);
        } else {
          this.selectedAgents = [];
        }
        this.debouncedGetTasks();
      },
      get() {
        return this.selectedAgents.length === this.agents.length;
      },
    },
    selectedAllUsers: {
      set(val) {
        if (val) {
          this.selectedUsers = this.users.map((u) => u.id);
        } else {
          this.selectedUsers = [];
        }
        this.debouncedGetTasks();
      },
      get() {
        return this.selectedUsers.length === this.users.length;
      },
    },
  },
  async mounted() {
    this.debouncedGetTasks = debounce(this.getTasks, 500);
    await Promise.all([
      this.$store.dispatch('agent/getAgents'),
      this.$store.dispatch('user/getUsers'),
    ]);
    this.selectedAgents = this.agents.map((a) => a.session_id);
    this.selectedUsers = this.users.map((u) => u.id);

    if (this.agent) {
      this.selectedAgents = [this.agent.session_id];
    }
  },
  methods: {
    getTasks() {
      this.$refs.agentTaskTable.debouncedGetTasks();
    },
  },
};
</script>

<style>
</style>
