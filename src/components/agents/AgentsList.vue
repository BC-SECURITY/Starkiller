<template>
  <div>
    <list-page-top
      v-if="active"
      :breads="breads"
      :show-create="false"
      :show-refresh="true"
      :show-delete="showDelete"
      delete-text="Kill"
      @delete="killAgents"
      @refresh="getAgents"
    />
    <div
      class="ml-3 mr-3 align-center"
      style="display: flex; "
    >
      <v-switch
        v-model="hideStaleAgentsCheckbox"
        label="Hide Stale Agents"
      />
      <v-switch
        v-model="hideArchivedAgentsCheckbox"
        class="pl-4"
        label="Hide Archived Agents"
      />
      <v-spacer />
      <v-menu
        v-model="showHeaderMenu"
        offset-y
        :close-on-content-click="false"
      >
        <template #activator="{ on, attrs }">
          <v-btn
            text
            icon
            x-small
            v-bind="attrs"
            v-on="on"
          >
            <v-icon>mdi-format-columns</v-icon>
          </v-btn>
        </template>
        <v-list
          style="overflow-y: auto;"
          max-height="400px"
        >
          <v-list-item>
            <v-checkbox
              v-model="selectedAll"
              :label="'Select All'"
            />
          </v-list-item>
          <v-divider class="pb-4" />
          <v-list-item
            v-for="(item, index) in selectableHeaders"
            :key="index"
          >
            <v-checkbox
              v-model="selectedHeadersTemp"
              :label="item.text"
              :value="item"
            />
          </v-list-item>
        </v-list>
        <v-card class="pt-4">
          <v-btn
            text
            class="mb-4"
            @click="showHeaderMenu = false"
          >
            Cancel
          </v-btn>
          <v-btn
            text
            class="ml-4 mb-4"
            @click="submitHeaderForm"
          >
            Save
          </v-btn>
        </v-card>
      </v-menu>
    </div>
    <v-data-table
      v-model="selected"
      :item-class="rowClass"
      :headers="headers"
      :items="sortedAgents"
      :footer-props="{
        itemsPerPageOptions: [5, 10, 15, 20, 50, 100],
      }"
      :items-per-page="15"
      item-key="session_id"
      dense
      show-select
    >
      <template #item.name="{ item }">
        <v-tooltip top>
          <template #activator="{ on }">
            <v-icon
              v-if="item.high_integrity"
              small
              v-on="on"
            >
              fa-user-cog
            </v-icon>
          </template>
          <span>Elevated Process</span>
        </v-tooltip>
        <router-link
          style="color: inherit;"
          :to="{ name: 'agentEdit', params: { id: item.session_id } }"
        >
          {{ item.name }}
        </router-link>
      </template>
      <template #item.lastseen_time="{ item }">
        <v-tooltip top>
          <template #activator="{ on }">
            <span v-on="on">{{ moment(item.lastseen_time).fromNow() }}</span>
          </template>
          <span>{{ moment(item.lastseen_time).format('MMM D YYYY, h:mm:ss a') }}</span>
        </v-tooltip>
      </template>
      <template #item.checkin_time="{ item }">
        <v-tooltip top>
          <template #activator="{ on }">
            <span v-on="on">{{ moment(item.checkin_time).fromNow() }}</span>
          </template>
          <span>{{ moment(item.checkin_time).format('MMM D YYYY, h:mm:ss a') }}</span>
        </v-tooltip>
      </template>
      <template #item.listener="{ item }">
        <router-link
          style="color: inherit;"
          :to="{ name: 'listenerEdit', params: { id: item.listener } }"
        >
          {{ item.listener }}
        </router-link>
      </template>
      <template #item.process_name="{ item }">
        <span>{{ truncateMessage(item.process_name) }}</span>
      </template>
      <template #item.actions="{ item }">
        <v-menu offset-y>
          <template #activator="{ on, attrs }">
            <v-btn
              text
              icon
              x-small
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>fa-ellipsis-v</v-icon>
            </v-btn>
          </template>
          <v-list class="ml-2 mr-2">
            <v-list-item
              key="view"
              link
            >
              <router-link
                class="text-decoration-none"
                style="color: inherit;"
                :to="{ name: 'agentEdit', params: { id: item.session_id } }"
              >
                <v-list-item-title>
                  <v-icon>fa-binoculars</v-icon>
                  View
                </v-list-item-title>
              </router-link>
            </v-list-item>
            <v-list-item
              key="popout"
              link
              @click="popout(item)"
            >
              <v-list-item-title>
                <v-icon>
                  fa-external-link-alt
                </v-icon>
                Popout
              </v-list-item-title>
            </v-list-item>
            <v-divider class="pb-4" />
            <v-list-item
              key="delete"
              link
              @click="killAgent(item)"
            >
              <v-list-item-title>
                <v-icon>fa-trash-alt</v-icon>
                Kill
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import moment from 'moment';
import { mapState } from 'vuex';
import ListPageTop from '@/components/ListPageTop.vue';

export default {
  name: 'AgentList',
  components: {
    ListPageTop,
  },
  props: {
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
          text: 'List',
          disabled: true,
          href: '/agents?tab=list-view',
        },
      ],
      headersFull: [
        {
          text: 'Name', value: 'name', defaultHeader: true, alwaysShow: true, order: 1,
        },
        {
          text: 'Last Seen', value: 'lastseen_time', defaultHeader: true, alwaysShow: true, order: 2,
        },
        {
          text: 'First Seen', value: 'checkin_time', defaultHeader: true, alwaysShow: true, order: 3,
        },
        {
          text: 'Listener', value: 'listener', order: 4,
        },
        {
          text: 'Hostname', value: 'hostname', defaultHeader: true, order: 5,
        },
        {
          text: 'Process', value: 'process_name', defaultHeader: true, order: 6,
        },
        { text: 'Process ID', value: 'process_id', order: 7 },
        {
          text: 'Architecture', value: 'architecture', defaultHeader: true, order: 8,
        },
        {
          text: 'Language', value: 'language', defaultHeader: true, order: 9,
        },
        { text: 'Language Version', value: 'language_version', order: 10 },
        {
          text: 'Username', value: 'username', defaultHeader: true, order: 11,
        },
        { text: 'Working Hours', value: 'working_hours', order: 12 },
        { text: 'Exteneral IP', value: 'external_ip', order: 13 },
        {
          text: 'Internal IP', value: 'internal_ip', defaultHeader: true, order: 14,
        },
        { text: 'Delay', value: 'delay', order: 15 },
        { text: 'Jitter', value: 'jitter', order: 16 },
        {
          text: 'Actions', value: 'actions', defaultHeader: true, alwaysShow: true, order: 17,
        },
      ],
      selectedHeadersTemp: [],
      selected: [],
      showHeaderMenu: false,
      moment,
    };
  },
  computed: {
    ...mapState({
      agents: (state) => state.agent.agents,
      hideStaleAgents: (state) => state.application.hideStaleAgents,
      hideArchivedAgents: (state) => state.application.hideArchivedAgents,
      selectedHeadersState: (state) => state.application.agentHeaders,
    }),
    selectedAll: {
      set(val) {
        this.selectedHeadersTemp = [...this.staticHeaders];
        if (val) {
          this.headersFull.forEach((h) => {
            this.selectedHeadersTemp.push(h);
          });
        }
      },
      get() {
        return this.selectedHeadersTemp.length === this.count;
      },
    },
    headers() {
      return this.headersFull
        .filter((h) => this.selectedHeaders.findIndex((h2) => h2.text === h.text) > -1)
        .sort((a, b) => a.order - b.order);
    },
    selectableHeaders() {
      return this.headersFull
        .filter((h) => !h.alwaysShow);
    },
    staticHeaders() {
      return this.headersFull
        .filter((h) => h.alwaysShow);
    },
    sortedAgents() {
      const sorted = this.agents.slice();
      sorted.sort((a, b) => -a.lastseen_time.localeCompare(b.lastseen_time));
      if (this.hideStaleAgents) {
        return sorted.filter((agent) => !agent.stale);
      }
      if (this.hideArchivedAgents) {
        return sorted.filter((agent) => !agent.archived);
      }
      return sorted;
    },
    showDelete() {
      return this.selected.length > 0;
    },
    hideStaleAgentsCheckbox: {
      set(val) {
        this.$store.dispatch('application/hideStaleAgents', val);
      },
      get() {
        return this.hideStaleAgents;
      },
    },
    hideArchivedAgentsCheckbox: {
      set(val) {
        this.$store.dispatch('application/hideArchivedAgents', val);
      },
      get() {
        return this.hideArchivedAgents;
      },
    },
    selectedHeaders: {
      set(val) {
        this.$store.dispatch('application/agentHeaders', val);
      },
      get() {
        return this.selectedHeadersState;
      },
    },
  },
  mounted() {
    this.getAgents();
    if (this.selectedHeaders.length === 0) {
      this.selectedHeaders = this.headersFull.filter((h) => h.defaultHeader === true);
    }
    this.selectedHeadersTemp = [...this.selectedHeaders];
  },
  methods: {
    submitHeaderForm() {
      this.selectedHeaders = [...this.selectedHeadersTemp];
      this.showHeaderMenu = false;
    },
    async killAgents() {
      if (await this.$root.$confirm('Kill Agent', `Do you want to kill ${this.selected.length} agents?`, { color: 'red' })) {
        this.selected.forEach((agent) => {
          this.$store.dispatch('agent/killAgent', { sessionId: agent.session_id });
        });
        this.$snack.success(`${this.selected.length} agents tasked to run TASK_EXIT.`);
        this.selected = [];
      }
    },
    getAgents() {
      this.$store.dispatch('agent/getAgents');
    },
    async killAgent(item) {
      if (await this.$root.$confirm('Kill Agent', `Do you want to kill agent ${item.name}?`, { color: 'red' })) {
        this.$store.dispatch('agent/killAgent', { sessionId: item.session_id });
        this.$snack.success(`Agent ${item.name} tasked to run TASK_EXIT.`);
      }
    },
    popout(item) {
      window.open(`${window.location.href}/${item.name}?hideSideBar=true`, 'popup', 'width=600,height=600');
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

<style>
</style>
