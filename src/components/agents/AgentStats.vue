<template>
  <div class="pa-4 sk-stats-surface">
    <h1 class="d-sr-only">Agent statistics</h1>
    <div class="d-flex justify-end align-center ga-2 mb-3">
      <span
        v-if="lastRefreshedDisplay"
        class="text-body-small text-medium-emphasis"
      >
        Refreshed {{ lastRefreshedDisplay }}
      </span>
      <v-chip size="x-small" variant="tonal" :color="autoRefreshStatus.color">
        {{ autoRefreshStatus.label }}
      </v-chip>
      <v-tooltip location="bottom">
        <template #activator="{ props: activatorProps }">
          <v-btn
            icon
            size="small"
            variant="text"
            :loading="loading"
            v-bind="activatorProps"
            @click="refreshAll"
          >
            <v-icon>fa-redo</v-icon>
          </v-btn>
        </template>
        <span>Refresh stats</span>
      </v-tooltip>
    </div>

    <v-alert
      v-if="errorMessage"
      type="error"
      density="compact"
      class="mb-4"
      closable
      @click:close="errorMessage = null"
    >
      {{ errorMessage }}
    </v-alert>

    <v-row>
      <v-col
        v-for="tile in toplineTiles"
        :key="tile.title"
        cols="12"
        sm="4"
        md="4"
      >
        <v-card class="mx-auto">
          <v-card-title>{{ tile.title }}</v-card-title>
          <v-card-text class="text-center">
            <div
              class="d-flex align-center justify-center"
              style="min-height: 64px"
            >
              <v-skeleton-loader v-if="loading" type="heading" />
              <p
                v-else
                class="sk-metric-value"
                :aria-label="`${tile.title}: ${tile.value}`"
              >
                {{ tile.value }}
              </p>
              <v-tooltip v-if="!loading && tile.warning" location="top">
                <template #activator="{ props: activatorProps }">
                  <v-icon
                    v-bind="activatorProps"
                    size="small"
                    color="warning"
                    class="ml-2"
                  >
                    fa-exclamation-triangle
                  </v-icon>
                </template>
                <span>{{ tile.warning }}</span>
              </v-tooltip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="tile in infoTiles"
        :key="tile.title"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card class="mx-auto" density="compact">
          <v-card-title class="text-title-small">{{ tile.title }}</v-card-title>
          <v-card-text>
            <div class="text-body-medium">{{ tile.value }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="mx-auto" :min-height="`${CHART_HEIGHT_PX}px`">
          <v-card-title>Check Ins</v-card-title>
          <v-card-text>
            <checkin-chart
              v-if="loaded"
              v-model:timeframe="checkinTimeframe"
              :session-ids="agentSessionIdArray"
              :agent-name-map="agentNameMap"
              :refresh-key="chartRefreshKey"
              :paused="!active || !!agent?.archived"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="mx-auto" :min-height="`${CHART_HEIGHT_PX}px`">
          <v-card-title class="sk-card-title-row">
            <span>Tasks Over Time</span>
            <span class="text-body-small text-medium-emphasis">
              (most recent {{ TASKS_LIMIT }} tasks)
            </span>
            <v-chip
              v-if="totalTasks !== null && totalTasks > TASKS_LIMIT"
              size="small"
              color="warning"
              variant="tonal"
            >
              Showing {{ TASKS_LIMIT }} of {{ totalTasks }}
            </v-chip>
            <v-spacer />
            <div class="flex-shrink-0" style="width: 120px">
              <v-select
                v-model="taskTimeframe"
                :items="timeframeOptions"
                density="compact"
                variant="outlined"
                hide-details
              />
            </div>
          </v-card-title>
          <v-card-text>
            <v-skeleton-loader v-if="loading" type="image" />
            <div
              v-else-if="taskChartData.datasets[0].data.length > 0"
              class="sk-chart-canvas"
              role="img"
              :aria-label="taskChartA11yLabel"
            >
              <LineChart
                :key="taskTimeframe"
                :data="taskChartData"
                :options="taskChartOptions"
              />
            </div>
            <div v-else class="text-center text-medium-emphasis">
              No tasks recorded for this agent.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { Line as LineChart } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeSeriesScale,
} from "chart.js";
import "chartjs-adapter-dayjs-4";
import dayjs from "@/plugins/dayjs";

import CheckinChart from "@/components/charts/CheckinChart.vue";
import {
  TIMEFRAME_OPTIONS,
  TIMEFRAME_UNIT,
  timeframeComputed,
  dayKey,
} from "@/components/charts/timeframe";
import { CHART_HEIGHT_PX, TASKS_LINE_COLOR } from "@/components/charts/tokens";
import { deriveCounts } from "@/components/agents/agent-stats-counts";
import * as agentTaskApi from "@/api/agent-task-api";
import { useApplicationStore } from "@/stores/application-module";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeSeriesScale,
);

const TASKS_LIMIT = 1000;
const NOW_TICK_MS = 5000;
const AUTO_REFRESH_MS = 8000;
const AUTO_REFRESH_SECONDS = AUTO_REFRESH_MS / 1000;
// Stop auto-refresh after this many consecutive non-404 failures so a
// persistently-broken endpoint isn't polled every 8s forever.
const MAX_AUTO_REFRESH_FAILURES = 10;

export default {
  name: "AgentStats",
  components: { LineChart, CheckinChart },
  inject: { snack: { default: null } },
  props: {
    agent: {
      type: Object,
      required: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
    refreshTasks: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      TASKS_LIMIT,
      timeframeOptions: TIMEFRAME_OPTIONS,
      loaded: false,
      loading: false,
      errorMessage: null,
      totalTasks: null,
      queuedTasks: null,
      // True when the queued-count endpoint failed (vs. simply not loaded), so
      // the tile can distinguish "unavailable" from "no agent" / "loading".
      queuedUnavailable: false,
      chartRefreshKey: 0,
      autoRefreshInterval: null,
      taskRecords: [],
      now: new Date(),
      nowTimer: null,
      lastRefreshedAt: null,
      // Race guard: every refresh captures a seq; assignments are dropped if
      // the seq advances (e.g. user switched agents mid-fetch).
      fetchSeq: 0,
      consecutiveAutoRefreshFailures: 0,
    };
  },
  computed: {
    // Compile-time constants exposed to the template without wrapping them
    // in a reactive data() proxy.
    CHART_HEIGHT_PX: () => CHART_HEIGHT_PX,
    AUTO_REFRESH_SECONDS: () => AUTO_REFRESH_SECONDS,
    // Persisted view preferences. Shared across all agents on purpose — a
    // user who picks "Hour" while viewing agent A keeps "Hour" on agent B.
    taskTimeframe: timeframeComputed(
      useApplicationStore,
      "agentStatsTaskTimeframe",
      "Day",
    ),
    checkinTimeframe: timeframeComputed(
      useApplicationStore,
      "agentStatsCheckinTimeframe",
      "Second",
    ),
    // Single source of truth for the auto-refresh chip. Distinct labels per
    // off-reason help the user diagnose *why* updates stopped. The final
    // "Stopped" branch catches out-of-band stops (the 404 case in
    // refreshCounts clears autoRefreshInterval without flipping a prop).
    autoRefreshStatus() {
      if (!this.agent?.session_id) {
        return { color: "grey", label: "Counts · No session" };
      }
      if (this.agent?.archived) {
        return { color: "grey", label: "Counts · Archived" };
      }
      if (!this.active) {
        return { color: "grey", label: "Counts · Tab inactive" };
      }
      if (!this.refreshTasks) {
        return { color: "grey", label: "Counts · Manual mode" };
      }
      if (!this.autoRefreshInterval) {
        return { color: "warning", label: "Counts · Stopped" };
      }
      return {
        color: "success",
        label: `Counts · live (every ${AUTO_REFRESH_SECONDS}s)`,
      };
    },
    taskChartA11yLabel() {
      const count = this.taskRecords.length;
      const unit = this.taskTimeframe.toLowerCase();
      return `Tasks over time, ${count} tasks grouped by ${unit}.`;
    },
    agentSessionIdArray() {
      return this.agent?.session_id ? [this.agent.session_id] : [];
    },
    agentNameMap() {
      if (!this.agent?.session_id) return {};
      return {
        [this.agent.session_id]: this.agent.name || this.agent.session_id,
      };
    },
    lastSeen() {
      const ts = this.agent?.lastseen_time || this.agent?.checkin_time;
      return ts ? dayjs(ts).from(this.now) : "—";
    },
    lastRefreshedDisplay() {
      if (!this.lastRefreshedAt) return null;
      return dayjs(this.lastRefreshedAt).from(this.now);
    },
    integrity() {
      return this.agent?.high_integrity ? "Elevated" : "Standard";
    },
    host() {
      const hostname = this.agent?.hostname || "—";
      const ip = this.agent?.internal_ip;
      return ip ? `${hostname} (${ip})` : hostname;
    },
    languageDisplay() {
      const lang = this.agent?.language || "—";
      const ver = this.agent?.language_version;
      return ver ? `${lang} ${ver}` : lang;
    },
    toplineTiles() {
      return [
        { title: "Last Seen", value: this.lastSeen },
        {
          title: "Total Tasks",
          value: this.totalTasks !== null ? this.totalTasks : "—",
        },
        {
          title: "Queued Tasks",
          value: this.queuedTasks !== null ? this.queuedTasks : "—",
          warning: this.queuedUnavailable ? "Queued count unavailable" : null,
        },
      ];
    },
    infoTiles() {
      // Order matters at sm-only width (600–959px): cols=12 sm=6 md=4
      // means three tiles wrap as 6+6 / 6, so the third tile sits alone
      // on row 2 with empty space to its right. Host has the longest
      // text ("hostname (ip)") and benefits from that breathing room.
      // At md+ all three fit on one row at 4 cols each — order is moot.
      return [
        { title: "Language", value: this.languageDisplay },
        { title: "Integrity", value: this.integrity },
        { title: "Host", value: this.host },
      ];
    },
    taskChartData() {
      const formatters = {
        Day: (ts) => dayKey(ts),
        Hour: (ts) => dayjs(ts).startOf("hour").toISOString(),
        Minute: (ts) => dayjs(ts).startOf("minute").toISOString(),
        Second: (ts) => dayjs(ts).startOf("second").toISOString(),
      };
      const fmt = formatters[this.taskTimeframe] || formatters.Day;
      const buckets = new Map();
      this.taskRecords.forEach((task) => {
        const ts = task.created_at || task.timestamp;
        if (!ts) return;
        const key = fmt(ts);
        buckets.set(key, (buckets.get(key) || 0) + 1);
      });
      const sortedKeys = Array.from(buckets.keys()).sort();
      return {
        datasets: [
          {
            label: "Tasks",
            backgroundColor: TASKS_LINE_COLOR,
            borderColor: TASKS_LINE_COLOR,
            tension: 0.3,
            fill: false,
            data: sortedKeys.map((k) => ({ x: k, y: buckets.get(k) })),
          },
        ],
      };
    },
    taskChartOptions() {
      const unit = TIMEFRAME_UNIT[this.taskTimeframe] || TIMEFRAME_UNIT.Day;
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        transitions: { active: { animation: { duration: 0 } } },
        scales: {
          x: {
            type: "time",
            time: {
              unit,
              displayFormats: {
                day: "MMM D",
                hour: "MMM D hA",
                minute: "MMM D HH:mm",
                second: "MMM D HH:mm:ss",
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      };
    },
  },
  watch: {
    active: {
      immediate: true,
      handler(val) {
        if (val) {
          if (!this.loaded && this.agent?.session_id) {
            this.refreshAll();
          }
          this.startNowTimer();
          if (this.refreshTasks) this.startAutoRefresh();
        } else {
          this.stopNowTimer();
          this.stopAutoRefresh();
        }
      },
    },
    refreshTasks(val) {
      if (val && this.active) {
        this.startAutoRefresh();
      } else if (!val) {
        this.stopAutoRefresh();
      }
    },
    "agent.session_id": "handleAgentChange",
  },
  beforeUnmount() {
    this.stopAutoRefresh();
    this.stopNowTimer();
  },
  methods: {
    handleAgentChange(val) {
      if (!val) return;
      // Invalidate any in-flight fetch for the previous agent so its response
      // can't land on the new agent's state. Reset regardless of `active` so
      // a later tab activation triggers a fresh fetch instead of showing the
      // previous agent's cached data.
      this.fetchSeq += 1;
      this.loaded = false;
      this.consecutiveAutoRefreshFailures = 0;
      this.errorMessage = null;
      if (this.active) {
        this.refreshAll();
      }
    },
    startNowTimer() {
      this.stopNowTimer();
      this.nowTimer = setInterval(() => {
        this.now = new Date();
      }, NOW_TICK_MS);
    },
    stopNowTimer() {
      if (this.nowTimer) {
        clearInterval(this.nowTimer);
        this.nowTimer = null;
      }
    },
    startAutoRefresh() {
      // Idempotent: watch.active and watch.refreshTasks can fire in the
      // same tick on hydration; skip the redundant stop/start cycle so
      // we don't churn the interval handle.
      if (this.autoRefreshInterval) return;
      this.autoRefreshInterval = setInterval(() => {
        if (this.agent?.session_id && this.active && !this.agent.archived) {
          this.refreshCounts();
        }
      }, AUTO_REFRESH_MS);
    },
    stopAutoRefresh() {
      if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval);
        this.autoRefreshInterval = null;
      }
    },
    async refreshAll() {
      if (!this.agent?.session_id) return;
      this.fetchSeq += 1;
      const mySeq = this.fetchSeq;
      if (!this.loaded) this.loading = true;
      this.errorMessage = null;
      try {
        const [counts, records] = await Promise.all([
          this.fetchCounts(),
          this.fetchTaskHistory(),
        ]);
        if (mySeq !== this.fetchSeq) return;
        this.totalTasks = counts.total;
        this.queuedTasks = counts.queued;
        this.queuedUnavailable = counts.queuedUnavailable;
        this.taskRecords = records;
        this.loaded = true;
        this.chartRefreshKey += 1;
        this.lastRefreshedAt = Date.now();
        this.now = new Date();
        this.consecutiveAutoRefreshFailures = 0;
        // Resume polling if a prior failure cap (or any stop) left it off —
        // this is what makes the "Click Refresh to retry" message true.
        // startAutoRefresh is idempotent, so this is a no-op when already live.
        if (this.active && this.refreshTasks && !this.agent?.archived) {
          this.startAutoRefresh();
        }
      } catch (err) {
        if (mySeq !== this.fetchSeq) return;
        const message = err?.message || String(err);
        this.errorMessage = `Failed to load stats: ${message}`;
        if (this.snack) this.snack.error(this.errorMessage);
      } finally {
        // loading is UX state, not correctness — always clear it so a
        // superseded fetch doesn't leave skeletons stuck on screen.
        this.loading = false;
      }
    },
    async refreshCounts() {
      if (!this.agent?.session_id) return;
      this.fetchSeq += 1;
      const mySeq = this.fetchSeq;
      try {
        const previousTotal = this.totalTasks;
        const counts = await this.fetchCounts();
        if (mySeq !== this.fetchSeq) return;
        this.totalTasks = counts.total;
        this.queuedTasks = counts.queued;
        this.queuedUnavailable = counts.queuedUnavailable;
        if (counts.total !== null && counts.total !== previousTotal) {
          const records = await this.fetchTaskHistory();
          if (mySeq !== this.fetchSeq) return;
          this.taskRecords = records;
        }
        this.lastRefreshedAt = Date.now();
        this.now = new Date();
        // Decrement rather than hard-reset so a flapping endpoint
        // (success, fail, success, fail, ...) still nets upward and eventually
        // trips the failure thresholds instead of being masked indefinitely by
        // the intermittent successes.
        this.consecutiveAutoRefreshFailures = Math.max(
          0,
          this.consecutiveAutoRefreshFailures - 1,
        );
        if (this.consecutiveAutoRefreshFailures === 0) this.errorMessage = null;
      } catch (err) {
        if (mySeq !== this.fetchSeq) return;
        // 404 is terminal — the agent was purged from the backend. Surface
        // immediately and stop hammering the dead endpoint.
        if (err?.response?.status === 404) {
          this.errorMessage =
            "Agent no longer exists on the server (likely removed).";
          this.stopAutoRefresh();
          return;
        }
        this.consecutiveAutoRefreshFailures += 1;
        if (this.consecutiveAutoRefreshFailures >= MAX_AUTO_REFRESH_FAILURES) {
          // Give up on a persistently-failing endpoint; let the user retry.
          this.stopAutoRefresh();
          this.errorMessage =
            "Auto-refresh stopped after repeated failures. Click Refresh to retry.";
        } else if (this.consecutiveAutoRefreshFailures >= 3) {
          // Stay silent for the first couple of failures so a single transient
          // blip doesn't flash a banner.
          const message = err?.message || String(err);
          this.errorMessage = `Auto-refresh failing: ${message}`;
        }
      }
    },
    async fetchCounts() {
      const sessionId = this.agent.session_id;
      const [totalResp, queuedResp] = await Promise.allSettled([
        agentTaskApi.getTasks(sessionId, { limit: 1, page: 1 }),
        agentTaskApi.getTasks(sessionId, {
          limit: 1,
          page: 1,
          status: "queued",
        }),
      ]);
      // deriveCounts owns the degradation logic (queued is a decorative tile —
      // it degrades rather than failing the whole stats view) and is unit-tested.
      return deriveCounts(totalResp, queuedResp);
    },
    async fetchTaskHistory() {
      const sessionId = this.agent.session_id;
      const response = await agentTaskApi.getTasks(sessionId, {
        limit: TASKS_LIMIT,
        page: 1,
        sortBy: "id",
        sortOrder: "desc",
      });
      return response?.records || [];
    },
  },
};
</script>
