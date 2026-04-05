<template>
  <div>
    <div
      class="ml-3 mr-3 align-center"
      style="display: flex; flex-direction: row-reverse"
    >
      <div style="height: 40px" />
      <header-menu
        :headers-full="headersFull"
        :initial-selected-headers="selectedHeadersTemp"
        :default-headers="headersFull.filter((h) => h.defaultHeader === true)"
        @submit="submitHeaderForm"
      />
    </div>
    <v-data-table
      v-model="selected"
      :loading="agentsStatus === 'loading'"
      :row-props="getRowProps"
      :headers="headers"
      :items="sortedAgents"
      :items-per-page-options="[5, 10, 15, 20, 50, 100]"
      :items-per-page="15"
      item-value="session_id"
      density="compact"
      show-select
    >
      <template #item.name="{ item }">
        <v-tooltip location="top">
          <template #activator="{ props: activatorProps }">
            <v-icon
              v-if="item.high_integrity"
              size="small"
              v-bind="activatorProps"
            >
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
        <v-menu>
          <template #activator="{ props: activatorProps }">
            <v-btn variant="text" icon size="x-small" v-bind="activatorProps">
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
import DateTimeDisplay from "@/components/DateTimeDisplay.vue";
import TagViewer from "@/components/TagViewer.vue";
import HeaderMenu from "@/components/HeaderMenu.vue";
import * as agentApi from "@/api/agent-api";
import { useAgentStore } from "@/stores/agent-module";
import { useApplicationStore } from "@/stores/application-module";
import * as agentTaskApi from "@/api/agent-task-api";

export default {
  name: "AgentsTable",
  components: {
    DateTimeDisplay,
    TagViewer,
    HeaderMenu,
  },
  inject: ["snack"],
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
  emits: ["update:modelValue", "refresh-tags", "kill-agent"],
  data() {
    return {
      loading: false,
      headersFull: [
        {
          title: "Name",
          key: "name",
          defaultHeader: true,
          alwaysShow: true,
          order: 1,
        },
        {
          title: "Last Seen",
          key: "lastseen_time",
          defaultHeader: true,
          alwaysShow: true,
          order: 2,
        },
        {
          title: "First Seen",
          key: "checkin_time",
          defaultHeader: true,
          alwaysShow: true,
          order: 3,
        },
        {
          title: "Listener",
          key: "listener",
          order: 4,
        },
        {
          title: "Hostname",
          key: "hostname",
          defaultHeader: true,
          order: 5,
        },
        {
          title: "Process",
          key: "process_name",
          defaultHeader: true,
          order: 6,
        },
        { title: "Process ID", key: "process_id", order: 7 },
        {
          title: "Architecture",
          key: "architecture",
          order: 8,
        },
        {
          title: "Language",
          key: "language",
          defaultHeader: true,
          order: 9,
        },
        { title: "Language Version", key: "language_version", order: 10 },
        {
          title: "Username",
          key: "username",
          defaultHeader: true,
          order: 11,
        },
        { title: "Working Hours", key: "working_hours", order: 12 },
        { title: "External IP", key: "external_ip", order: 13 },
        {
          title: "Internal IP",
          key: "internal_ip",
          defaultHeader: true,
          order: 14,
        },
        { title: "Delay", key: "delay", order: 15 },
        { title: "Jitter", key: "jitter", order: 16 },
        {
          title: "Tags",
          key: "tags",
          order: 17,
        },
        {
          title: "Actions",
          key: "actions",
          defaultHeader: true,
          alwaysShow: true,
          order: 18,
        },
      ],
      selectedHeadersTemp: [],
      selected: [],
      refreshInterval: null,
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
    headers() {
      return this.headersFull
        .filter(
          (h) =>
            this.applicationStore.agentHeaders.findIndex(
              (h2) => h2.title === h.title,
            ) > -1,
        )
        .sort((a, b) => a.order - b.order);
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
      this.$emit("update:modelValue", val);
    },
    refreshAgents: {
      handler(newVal) {
        if (newVal) {
          this.getAgents();
          this.refreshInterval = setInterval(() => {
            this.getAgents();
          }, 8000);
        } else {
          clearInterval(this.refreshInterval);
        }
      },
      immediate: true,
    },
  },
  beforeUnmount() {
    clearInterval(this.refreshInterval);
  },
  async mounted() {
    this.getAgents();
    if (
      this.applicationStore.agentHeaders.length === 0 ||
      !this.applicationStore.agentHeaders[0].title
    ) {
      this.applicationStore.agentHeaders = this.headersFull.filter(
        (h) => h.defaultHeader === true,
      );
    }
    this.selectedHeadersTemp = this.headersFull.filter((h) =>
      this.applicationStore.agentHeaders.some((h2) => h2.title === h.title),
    );
  },
  methods: {
    deleteTag(agent, tag) {
      agentApi
        .deleteTag(agent.session_id, tag.id)
        .then(() => {
          agent.tags = agent.tags.filter((t) => t.id !== tag.id);
          this.$emit("refresh-tags");
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    updateTag(agent, tag) {
      agentApi
        .updateTag(agent.session_id, tag)
        .then((t) => {
          const index = agent.tags.findIndex((x) => x.id === t.id);
          agent.tags.splice(index, 1, t);
          this.$emit("refresh-tags");
          this.snack.success("Tag updated");
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    addTag(agent, tag) {
      agentApi
        .addTag(agent.session_id, tag)
        .then((t) => {
          agent.tags.push(t);
          this.$emit("refresh-tags");
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    submitHeaderForm(val) {
      this.selectedHeadersTemp = val;
      this.applicationStore.agentHeaders = [...this.selectedHeadersTemp];
    },
    resetHeaders() {
      this.applicationStore.agentHeaders = this.headersFull.filter(
        (h) => h.defaultHeader === true,
      );
      this.selectedHeadersTemp = this.headersFull.filter((h) =>
        this.applicationStore.agentHeaders.some((h2) => h2.title === h.title),
      );
    },
    getAgents() {
      this.agentStore.getAgents();
    },
    async reloadSysInfo(agent) {
      try {
        await agentTaskApi.sysinfo(agent.session_id);
        this.snack.success(`SysInfo reload queued for ${agent.name}`);
      } catch (error) {
        this.snack.error(
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
    getRowProps({ item }) {
      return { class: item.stale ? "warning-row" : "" };
    },
  },
};
</script>

<style lang="scss">
.warning-row {
  background-color: #ffcccc;
}
.v-theme--dark .warning-row {
  background-color: #bd4c4c;
}
</style>
