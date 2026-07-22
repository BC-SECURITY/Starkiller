<template>
  <div class="sk-stats-surface">
    <h1 class="d-sr-only">Dashboard</h1>
    <list-page-top
      :breads="breads"
      :show-refresh="true"
      :refresh-loading="loadingStatus === 'loading'"
      @refresh="refreshAll"
    />
    <v-alert
      v-if="refreshError"
      type="error"
      density="compact"
      variant="tonal"
      closable
      class="ml-1 mr-1 mb-2"
      @click:close="refreshError = null"
    >
      {{ refreshError }}
    </v-alert>
    <v-row class="ml-1 mr-1">
      <v-col
        v-for="metric in toplineMetrics"
        :key="metric.title"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card class="mx-auto">
          <v-card-title>{{ metric.title }}</v-card-title>
          <v-card-text class="text-center">
            <p
              class="sk-metric-value"
              :aria-label="`${metric.title}: ${metric.value}`"
            >
              {{ metric.value }}
            </p>
          </v-card-text>
          <v-card-actions>
            <v-btn color="secondary" text :to="metric.route"> View </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row class="ml-1 mr-1">
      <v-col cols="12">
        <v-card class="mx-auto">
          <v-card-title>Topology</v-card-title>
          <v-card-text>
            <agent-graph expandable height="420px" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row class="ml-1 mr-1">
      <v-col cols="12" md="4">
        <v-card class="mx-auto">
          <v-card-title> Agents </v-card-title>
          <v-card-text class="text-center">
            <div :aria-label="agentDonut.a11yLabel">
              <Doughnut
                v-if="agentDonut.chartData"
                :data="agentDonut.chartData"
                :options="agentDonut.chartOptions"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <v-card class="mx-auto">
          <v-card-title> Recent Tasks </v-card-title>
          <v-card-text class="text-center">
            <agent-tasks-table
              :active="true"
              :hide-columns="['id', 'task_name']"
              :refresh-tasks="refreshTasks"
              :no-filters="true"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" sm="12" md="12">
        <v-card class="mx-auto" :min-height="`${CHART_HEIGHT_PX}px`">
          <v-card-title class="sk-card-title-row">
            <span>Check Ins</span>
            <v-autocomplete
              v-model="selectedAgentIds"
              :items="filteredAgents"
              item-title="name"
              item-value="session_id"
              label="Filter Agents"
              multiple
              chips
              closable-chips
              clearable
              density="compact"
              variant="outlined"
              hide-details
              class="flex-grow-1"
              style="max-width: 480px; min-width: 280px"
            />
            <div class="d-flex ga-2 align-center">
              <v-btn
                size="small"
                variant="text"
                :disabled="activeAgentCount === 0"
                @click="selectAllActiveAgents"
              >
                Select Active
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                :disabled="selectedAgentIds.length === 0"
                @click="selectedAgentIds = []"
              >
                Clear
              </v-btn>
              <span class="text-body-small text-medium-emphasis">
                {{ selectedAgentIds.length }} of {{ activeAgentCount }} selected
              </span>
            </div>
          </v-card-title>
          <v-card-text>
            <checkin-chart
              v-model:timeframe="checkinTimeframe"
              :session-ids="selectedAgentIds"
              :agent-name-map="agentNameMap"
              :refresh-key="chartRefreshKey"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { Doughnut } from "vue-chartjs";
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from "chart.js";

import AgentTasksTable from "@/components/agents/AgentTasksTable.vue";
import AgentGraph from "@/components/agents/AgentGraph.vue";
import CheckinChart from "@/components/charts/CheckinChart.vue";
import ListPageTop from "@/components/ListPageTop.vue";
import { CHART_HEIGHT_PX, CHART_PALETTE } from "@/components/charts/tokens";
import { timeframeComputed } from "@/components/charts/timeframe";
import { useListenerStore } from "@/stores/listener-module";
import { useAgentStore } from "@/stores/agent-module";
import { useCredentialStore } from "@/stores/credential-module";
import { useApplicationStore } from "@/stores/application-module";

ChartJS.register(ArcElement, Title, Tooltip, Legend);

export default {
  name: "Dashboard",
  components: {
    ListPageTop,
    AgentTasksTable,
    CheckinChart,
    Doughnut,
    AgentGraph,
  },
  inject: ["snack"],
  data() {
    return {
      breads: [
        {
          text: "Dashboard",
          disabled: true,
          href: "/dashboard",
        },
      ],
      refreshTasks: false,
      loadingStatus: "loading",
      chartRefreshKey: 0,
      refreshError: null,
    };
  },
  computed: {
    // Compile-time constant exposed to the template without wrapping it
    // in a reactive data() proxy.
    CHART_HEIGHT_PX: () => CHART_HEIGHT_PX,
    listenerStore() {
      return useListenerStore();
    },
    agentStore() {
      return useAgentStore();
    },
    credentialStore() {
      return useCredentialStore();
    },
    applicationStore() {
      return useApplicationStore();
    },
    listeners() {
      return this.listenerStore.listeners;
    },
    agents() {
      return this.agentStore.agents;
    },
    credentials() {
      return this.credentialStore.credentials;
    },
    selectedAgentIds: {
      get() {
        return this.applicationStore.dashboardSelectedAgentIds;
      },
      set(v) {
        this.applicationStore.dashboardSelectedAgentIds = v;
      },
    },
    // Persisted timeframe for the Dashboard's CheckinChart. Independent of
    // the AgentStats CheckinChart timeframe — see application-module.js.
    checkinTimeframe: timeframeComputed(
      useApplicationStore,
      "dashboardCheckinTimeframe",
      "Second",
    ),
    agentNameMap() {
      return Object.fromEntries(
        (this.agents || []).map((a) => [a.session_id, a.name]),
      );
    },
    filteredAgents() {
      const hide = this.applicationStore.hideArchivedAgents;
      return (this.agents || []).filter((a) => !(hide && a.archived));
    },
    activeAgentCount() {
      return (this.agents || []).filter((a) => !a.archived && !a.stale).length;
    },
    agentDonut() {
      if (!this.agents) {
        return { a11yLabel: "Agent language breakdown." };
      }
      const languages = this.agents.reduce((acc, agent) => {
        acc[agent.language] = (acc[agent.language] || 0) + 1;
        return acc;
      }, {});
      const labels = Object.keys(languages);
      const data = Object.values(languages);
      const pairs = labels.map((l, i) => `${l}: ${data[i]}`).join(", ");
      return {
        chartData: {
          labels,
          // Cycle the palette per slice so a 9th+ language gets a real color
          // instead of chart.js repeating the last entry / falling off the end.
          datasets: [
            {
              backgroundColor: labels.map(
                (_l, i) => CHART_PALETTE[i % CHART_PALETTE.length],
              ),
              data,
            },
          ],
        },
        chartOptions: { responsive: true },
        a11yLabel: pairs
          ? `Agent language breakdown: ${pairs}`
          : "Agent language breakdown.",
      };
    },
    toplineMetrics() {
      return [
        {
          title: "Agents",
          value: this.agents.length,
          route: { name: "agents" },
        },
        {
          title: "Credentials",
          value: this.credentials.length,
          route: { name: "credentials" },
        },
        {
          title: "Listeners",
          value: this.listeners.length,
          route: { name: "listeners" },
        },
      ];
    },
  },
  async mounted() {
    // Prune persisted selection against hydrated agents *before* any await so
    // the autocomplete never renders an `undefined` chip for a deleted agent.
    this.pruneSelection();
    await this.refreshAll();
    // Re-prune with fresh agents in case the hydrated set was empty/stale.
    this.pruneSelection();
  },
  methods: {
    async refreshAll() {
      this.loadingStatus = "loading";
      this.refreshError = null;
      const legs = [
        ["agents", this.agentStore.getAgents()],
        ["credentials", this.credentialStore.getCredentials()],
        ["listeners", this.listenerStore.getListeners()],
        ["tasks", this.getTasks()],
      ];
      const results = await Promise.allSettled(legs.map(([, p]) => p));
      const failed = results
        .map((r, i) =>
          r.status === "rejected"
            ? { name: legs[i][0], reason: r.reason }
            : null,
        )
        .filter(Boolean);
      // agentStore.getAgents() swallows its own errors and only sets
      // status="error", so allSettled never sees agent failures.
      if (
        this.agentStore.status === "error" &&
        !failed.some((f) => f.name === "agents")
      ) {
        failed.unshift({
          name: "agents",
          reason: this.agentStore.lastError || "Failed to load agents",
        });
      }
      // CheckinChart's fetch is independent of the other legs; bump the key
      // unconditionally so Day-mode (no auto-refresh) refetches even when
      // unrelated legs fail.
      this.chartRefreshKey += 1;
      if (failed.length > 0) {
        failed.forEach(({ name, reason }) => {
          // eslint-disable-next-line no-console
          console.error(`[Dashboard] ${name} refresh failed:`, reason);
        });
        const summary = failed
          .map(({ name, reason }) => `${name}: ${reason?.message || reason}`)
          .join("; ");
        this.refreshError = `Refresh failed — ${summary}`;
        if (this.snack) this.snack.error(this.refreshError);
        this.loadingStatus = "error";
      } else {
        this.loadingStatus = "complete";
      }
    },
    async getTasks() {
      this.refreshTasks = true;
      await this.$nextTick();
      this.refreshTasks = false;
    },
    pruneSelection() {
      if (this.selectedAgentIds.length === 0) return;
      const valid = new Set((this.agents || []).map((a) => a.session_id));
      const next = this.selectedAgentIds.filter((sid) => valid.has(sid));
      if (next.length !== this.selectedAgentIds.length) {
        this.selectedAgentIds = next;
      }
    },
    selectAllActiveAgents() {
      this.selectedAgentIds = (this.agents || [])
        .filter((a) => !a.archived && !a.stale)
        .map((a) => a.session_id);
    },
  },
};
</script>

<style></style>
