<template>
  <div>
    <div
      class="ml-3 mr-3 align-center"
      style="display: flex; flex-direction: row-reverse"
    >
      <div style="height: 40px" />
      <v-menu v-model="showHeaderMenu" offset-y :close-on-content-click="false">
        <template #activator="{ on, attrs }">
          <v-btn text icon x-small v-bind="attrs" v-on="on">
            <v-icon>mdi-format-columns</v-icon>
          </v-btn>
        </template>
        <v-list style="overflow-y: auto" max-height="400px">
          <v-list-item>
            <v-checkbox v-model="selectedAll" :label="'Select All'" />
          </v-list-item>
          <v-divider class="pb-4" />
          <v-list-item v-for="(item, index) in selectableHeaders" :key="index">
            <v-checkbox
              v-model="selectedHeadersTemp"
              :label="item.text"
              :value="item"
            />
          </v-list-item>
        </v-list>
        <v-card class="pt-4">
          <v-btn text class="mb-4" @click="showHeaderMenu = false">
            Cancel
          </v-btn>
          <v-btn text class="ml-4 mb-4" @click="submitHeaderForm"> Save </v-btn>
        </v-card>
      </v-menu>
    </div>
    <v-data-table
      v-model="selected"
      :loading="agentsStatus === 'loading'"
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
            <v-icon v-if="item.high_integrity" small v-on="on">
              fa-user-cog
            </v-icon>
          </template>
          <span>Elevated Process</span>
        </v-tooltip>
        <router-link
          style="color: inherit"
          :to="{ name: 'agentEdit', params: { id: item.session_id } }"
        >
          {{ item.name }}
        </router-link>
      </template>
      <template #item.lastseen_time="{ item }">
        <date-time-display :timestamp="item.lastseen_time" />
      </template>
      <template #item.checkin_time="{ item }">
        <date-time-display :timestamp="item.checkin_time" />
      </template>
      <template #item.listener="{ item }">
        <router-link
          style="color: inherit"
          :to="{ name: 'listenerEdit', params: { id: item.listener } }"
        >
          {{ item.listener }}
        </router-link>
      </template>
      <template #item.process_name="{ item }">
        <span>{{ truncateMessage(item.process_name) }}</span>
      </template>
      <template #item.tags="{ item }">
        <tag-viewer
          :tags="item.tags"
          @update-tag="updateTag(item, ...arguments)"
          @delete-tag="deleteTag(item, ...arguments)"
          @new-tag="addTag(item, ...arguments)"
        />
      </template>
      <template #item.actions="{ item }">
        <v-menu offset-y>
          <template #activator="{ on, attrs }">
            <v-btn text icon x-small v-bind="attrs" v-on="on">
              <v-icon>fa-ellipsis-v</v-icon>
            </v-btn>
          </template>
          <v-list class="ml-2 mr-2">
            <v-list-item key="view" link>
              <router-link
                class="text-decoration-none"
                style="color: inherit"
                :to="{ name: 'agentEdit', params: { id: item.session_id } }"
              >
                <v-list-item-title>
                  <v-icon>fa-binoculars</v-icon>
                  View
                </v-list-item-title>
              </router-link>
            </v-list-item>
            <v-list-item key="popout" link @click="popout(item)">
              <v-list-item-title>
                <v-icon> fa-external-link-alt </v-icon>
                Popout
              </v-list-item-title>
            </v-list-item>
            <v-divider class="pb-4" />
            <v-list-item @click="reloadSysInfo(item)">
              <v-list-item-title>
                <v-icon>fa-sync</v-icon>
                Reload SysInfo
              </v-list-item-title>
            </v-list-item>
            <v-divider class="pb-4" />
            <v-list-item key="delete" link @click="killAgent(item)">
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
import moment from "moment";
import DateTimeDisplay from "@/components/DateTimeDisplay.vue";
import TagViewer from "@/components/TagViewer.vue";
import * as agentApi from "@/api/agent-api";
import { useAgentStore } from "@/stores/agent-module";
import { useApplicationStore } from "@/stores/application-module";
import * as agentTaskApi from "@/api/agent-task-api";

export default {
  name: "AgentsTable",
  components: {
    DateTimeDisplay,
    TagViewer,
  },
  props: {
    input: {
      type: Array,
      default: () => [],
    },
    selectedTags: {
      type: Array,
      default: () => [],
    },
    hideStaleAgents: {
      type: Boolean,
      required: true,
    },
    hideArchivedAgents: {
      type: Boolean,
      required: true,
    },
    refreshAgents: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: false,
      headersFull: [
        {
          text: "Name",
          value: "name",
          defaultHeader: true,
          alwaysShow: true,
          order: 1,
        },
        {
          text: "Last Seen",
          value: "lastseen_time",
          defaultHeader: true,
          alwaysShow: true,
          order: 2,
        },
        {
          text: "First Seen",
          value: "checkin_time",
          defaultHeader: true,
          alwaysShow: true,
          order: 3,
        },
        {
          text: "Listener",
          value: "listener",
          order: 4,
        },
        {
          text: "Hostname",
          value: "hostname",
          defaultHeader: true,
          order: 5,
        },
        {
          text: "Process",
          value: "process_name",
          defaultHeader: true,
          order: 6,
        },
        { text: "Process ID", value: "process_id", order: 7 },
        {
          text: "Architecture",
          value: "architecture",
          order: 8,
        },
        {
          text: "Language",
          value: "language",
          defaultHeader: true,
          order: 9,
        },
        { text: "Language Version", value: "language_version", order: 10 },
        {
          text: "Username",
          value: "username",
          defaultHeader: true,
          order: 11,
        },
        { text: "Working Hours", value: "working_hours", order: 12 },
        { text: "External IP", value: "external_ip", order: 13 },
        {
          text: "Internal IP",
          value: "internal_ip",
          defaultHeader: true,
          order: 14,
        },
        { text: "Delay", value: "delay", order: 15 },
        { text: "Jitter", value: "jitter", order: 16 },
        {
          text: "Tags",
          value: "tags",
          order: 17,
        },
        {
          text: "Actions",
          value: "actions",
          defaultHeader: true,
          alwaysShow: true,
          order: 18,
        },
      ],
      selectedHeadersTemp: [],
      selected: [],
      showHeaderMenu: false,
      refreshInterval: null,
      moment,
    };
  },
  computed: {
    agentStore() {
      return useAgentStore();
    },
    applicationStore() {
      return useApplicationStore();
    },
    agents() {
      return this.agentStore.agents;
    },
    agentsStatus() {
      return this.agentStore.status;
    },
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
        .filter(
          (h) =>
            this.applicationStore.agentHeaders.findIndex(
              (h2) => h2.text === h.text,
            ) > -1,
        )
        .sort((a, b) => a.order - b.order);
    },
    selectableHeaders() {
      return this.headersFull.filter((h) => !h.alwaysShow);
    },
    staticHeaders() {
      return this.headersFull.filter((h) => h.alwaysShow);
    },
    sortedAgents() {
      let sorted = this.agents.slice();
      sorted.sort((a, b) => a.checkin_time.localeCompare(b.checkin_time));
      if (this.hideStaleAgents) {
        sorted = sorted.filter((agent) => !agent.stale);
      }
      if (this.hideArchivedAgents) {
        sorted = sorted.filter((agent) => !agent.archived);
      }
      if (this.selectedTags.length === 0) {
        return sorted;
      }

      sorted = sorted.filter((agent) => {
        const agentTags = agent.tags.map((tag) => `${tag.name}:${tag.value}`);
        return agentTags.some((tag) => this.selectedTags.includes(tag));
      });

      return sorted;
    },
  },
  watch: {
    selectedTags() {
      this.getAgents();
    },
    selected(val) {
      this.$emit("input", val);
    },
    refreshAgents: {
      handler(newVal) {
        if (newVal) {
          this.getAgents();
          this.refreshInterval = setInterval(() => {
            this.getAgents();
          }, 8000);
        } else {
          console.log("Clearing interval");
          clearInterval(this.refreshInterval);
        }
      },
      immediate: true,
    },
  },
  beforeDestroy() {
    clearInterval(this.refreshInterval);
  },
  async mounted() {
    this.getAgents();
    if (this.applicationStore.agentHeaders.length === 0) {
      this.applicationStore.agentHeaders = this.headersFull.filter(
        (h) => h.defaultHeader === true,
      );
    }
    this.selectedHeadersTemp = [...this.applicationStore.agentHeaders];
  },
  methods: {
    deleteTag(agent, tag) {
      agentApi
        .deleteTag(agent.session_id, tag.id)
        .then(() => {
          agent.tags = agent.tags.filter((t) => t.id !== tag.id);
          this.$emit("refresh-tags");
        })
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    updateTag(agent, tag) {
      agentApi
        .updateTag(agent.session_id, tag)
        .then((t) => {
          const index = agent.tags.findIndex((x) => x.id === t.id);
          agent.tags.splice(index, 1, t);
          this.$emit("refresh-tags");
          this.$snack.success("Tag updated");
        })
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    addTag(agent, tag) {
      agentApi
        .addTag(agent.session_id, tag)
        .then((t) => {
          agent.tags.push(t);
          this.$emit("refresh-tags");
        })
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    submitHeaderForm() {
      this.applicationStore.agentHeaders = [...this.selectedHeadersTemp];
      this.showHeaderMenu = false;
    },
    getAgents() {
      this.agentStore.getAgents();
    },
    async reloadSysInfo(agent) {
      try {
        await agentTaskApi.sysinfo(agent.session_id);
        this.$snack.success(`SysInfo reload queued for ${agent.name}`);
      } catch (error) {
        this.$snack.error(
          `Error reloading SysInfo for ${agent.name}: ${error.message}`,
        );
      }
    },
    async killAgent(item) {
      this.$emit("kill-agent", item);
    },
    popout(item) {
      window.open(
        `${window.location.href}/${item.name}?hideSideBar=true`,
        "popup",
        "width=600,height=600",
      );
    },
    truncateMessage(str) {
      if (str) {
        return str.length > 30 ? `${str.substr(0, 30)}...` : str;
      }
      return "";
    },
    rowClass(item) {
      if (item.stale) return "warning-row";
      return "";
    },
  },
};
</script>

<style scoped></style>
