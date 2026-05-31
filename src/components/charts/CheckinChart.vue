<template>
  <div>
    <div class="d-flex justify-space-between align-start mb-2 ga-2">
      <span>{{ lookbackMessage }}</span>
      <div class="text-right flex-shrink-0" style="width: 140px">
        <v-select
          :model-value="timeframe"
          :items="timeframeOptions"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="onTimeframeChange"
        />
        <v-chip
          size="x-small"
          variant="tonal"
          :color="cadenceChip.color"
          class="mt-1"
        >
          {{ cadenceChip.label }}
        </v-chip>
      </div>
    </div>
    <div v-if="errorMessage">
      <v-alert type="error" density="compact" variant="tonal">
        {{ errorMessage }}
      </v-alert>
    </div>
    <template v-else>
      <v-chip
        v-if="showPartialFailureChip"
        color="warning"
        size="small"
        variant="tonal"
        class="mb-2"
      >
        {{ failedAgents.length }} agent(s) failed:
        {{ failedAgents.join(", ") }}
      </v-chip>
      <v-alert
        v-if="showTotalFailureAlert"
        type="warning"
        density="compact"
        variant="tonal"
        class="mb-2"
      >
        Failed to load checkin data for: {{ failedAgents.join(", ") }}
      </v-alert>
      <div
        v-if="hasData"
        class="sk-chart-canvas"
        role="img"
        :aria-label="chartA11yLabel"
      >
        <Bar :key="timeframe" :data="chartData" :options="chartOptions" />
      </div>
      <div
        v-else-if="!showTotalFailureAlert"
        class="sk-chart-canvas d-flex align-center justify-center text-center text-medium-emphasis"
      >
        No checkins recorded in this window.
      </div>
    </template>
  </div>
</template>

<script>
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  TimeSeriesScale,
} from "chart.js";
import "chartjs-adapter-dayjs-4";
import dayjs from "@/plugins/dayjs";

import * as agentApi from "@/api/agent-api";
import { TIMEFRAME_OPTIONS } from "@/components/charts/timeframe";
import { colorForSession } from "@/components/charts/tokens";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  TimeSeriesScale,
);

// `amount`/`unit` define the lookback window subtracted from "now"; the key is
// the bucketing granularity, not the window unit — so the Second view looks back
// 1 minute (60 seconds), expressed in minutes only because that's the smallest
// unit the date helper subtracts in.
const LOOKBACK_CONFIG = {
  Day: { amount: null, unit: null, message: "All Time" },
  Hour: { amount: 24, unit: "hours", message: "Last 24 Hours" },
  Minute: { amount: 30, unit: "minutes", message: "Last 30 Minutes" },
  Second: { amount: 1, unit: "minutes", message: "Last 60 Seconds" },
};

const REFRESH_CADENCE_MS = {
  Second: 5000,
  Minute: 30000,
  Hour: 300000,
  Day: null,
};

const REFRESH_CADENCE_LABEL = {
  Second: "Auto-refreshing every 5s",
  Minute: "Auto-refreshing every 30s",
  Hour: "Auto-refreshing every 5min",
  Day: "Manual refresh only",
};

export default {
  name: "CheckinChart",
  components: { Bar },
  inject: { snack: { default: null } },
  props: {
    sessionIds: {
      type: Array,
      default: () => [],
    },
    agentNameMap: {
      type: Object,
      default: () => ({}),
    },
    refreshKey: {
      type: Number,
      default: 0,
    },
    paused: {
      type: Boolean,
      default: false,
    },
    timeframe: {
      type: String,
      default: "Second",
    },
  },
  emits: ["update:timeframe"],
  data() {
    return {
      timeframeOptions: TIMEFRAME_OPTIONS,
      lookbackMessage: "",
      latestRecord: null,
      errorMessage: null,
      chartData: {
        datasets: [],
      },
      // Race guard: a fetch only applies its result if its captured seq still
      // equals the current one. Bumped on every fetch start and on pause so
      // in-flight responses are dropped instead of clobbering newer state.
      fetchSeq: 0,
      abortController: null,
      debounceTimer: null,
      autoRefreshInterval: null,
      failedAgents: [],
    };
  },
  computed: {
    // Computed (not mutated data) so every timeframe change produces a NEW
    // options object reference. vue-chartjs deep-watches `options` but gates the
    // chart update on a reference change (nextOptions !== prevOptions), so an
    // in-place `time.unit` mutation fired the watcher yet was skipped — it
    // lagged one timeframe-switch behind the `:key`-driven remount.
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        transitions: { active: { animation: { duration: 0 } } },
        scales: {
          x: {
            type: "time",
            time: {
              unit: this.timeframe.toLowerCase(),
              displayFormats: {
                // Day is the "All Time" view whose data can span months/years,
                // so unlike the sub-day formats it keeps the year.
                day: "MMM D, YYYY",
                hour: "MMM D hA",
                minute: "MMM D hh:mmA",
                second: "MMM D hh:mm:ssA",
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
    hasData() {
      return (this.chartData.datasets || []).some(
        (ds) => (ds.data || []).length > 0,
      );
    },
    // Single source of truth for the cadence chip. Precedence: paused >
    // Day (no auto-refresh) > active interval. Matches the {color, label}
    // shape used by autoRefreshStatus in AgentStats for consistency.
    cadenceChip() {
      if (this.paused) return { color: "warning", label: "Paused" };
      if (this.timeframe === "Day") {
        return { color: "grey", label: "Manual refresh only" };
      }
      return {
        color: "success",
        label: REFRESH_CADENCE_LABEL[this.timeframe] || "",
      };
    },
    // failedAgents is only populated in the per-agent fetch branch
    // (sessionIds.length > 0); the aggregate branch surfaces failures via
    // errorMessage instead. So failedAgents.length > 0 implies sessionIds
    // is non-empty and length comparisons are well-defined.
    allAgentsFailed() {
      return (
        this.failedAgents.length > 0 &&
        this.failedAgents.length === this.sessionIds.length &&
        !this.hasData
      );
    },
    // Partial-failure chip rides above the chart so surviving series still
    // render. Total-failure alert is the sole surface when nothing rendered
    // — never show both at once.
    showPartialFailureChip() {
      return this.failedAgents.length > 0 && !this.allAgentsFailed;
    },
    showTotalFailureAlert() {
      return this.allAgentsFailed;
    },
    chartA11yLabel() {
      const seriesCount = (this.chartData.datasets || []).length;
      return `Check-in counts for ${seriesCount} agent(s), ${this.lookbackMessage || "all time"}.`;
    },
  },
  watch: {
    sessionIds: {
      handler() {
        this.scheduleFetch();
      },
      deep: false,
    },
    timeframe() {
      // Stale anchor would clamp the next fetch to the old window's edge.
      this.latestRecord = null;
      // Restart the interval so REFRESH_CADENCE_MS picks up the new timeframe.
      this.stopAutoRefresh();
      this.scheduleFetch();
      this.startAutoRefresh();
    },
    refreshKey() {
      this.scheduleFetch();
    },
    paused(val) {
      if (val) {
        this.stopAutoRefresh();
        if (this.abortController) this.abortController.abort();
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
          this.debounceTimer = null;
        }
        // Drop any straggler response that returns after we've paused
        this.fetchSeq += 1;
      } else {
        // Clear stale error/failure state so a paused-then-healthy chart
        // doesn't linger on an old failure, and fetch immediately rather than
        // waiting up to a full cadence (forever for "Day", whose cadence is
        // null). The debounce collapses bursts.
        this.errorMessage = null;
        this.failedAgents = [];
        this.scheduleFetch();
        this.startAutoRefresh();
      }
    },
  },
  mounted() {
    // Respect the paused state on mount — an archived agent mounts the chart
    // (active=true) with paused=true, and the initial fetch must not slip past.
    if (!this.paused) this.fetchData();
    this.startAutoRefresh();
  },
  beforeUnmount() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.abortController) this.abortController.abort();
    this.stopAutoRefresh();
  },
  methods: {
    onTimeframeChange(val) {
      if (!TIMEFRAME_OPTIONS.includes(val)) return;
      this.$emit("update:timeframe", val);
    },
    scheduleFetch() {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.fetchData();
      }, 200);
    },
    startAutoRefresh() {
      this.stopAutoRefresh();
      const ms = REFRESH_CADENCE_MS[this.timeframe];
      if (!ms || this.paused) return;
      this.autoRefreshInterval = setInterval(() => {
        this.scheduleFetch();
      }, ms);
    },
    stopAutoRefresh() {
      if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval);
        this.autoRefreshInterval = null;
      }
    },
    async fetchData() {
      this.fetchSeq += 1;
      const mySeq = this.fetchSeq;
      if (this.abortController) this.abortController.abort();
      this.abortController = new AbortController();
      const { signal } = this.abortController;

      this.errorMessage = null;
      this.failedAgents = [];

      const config = LOOKBACK_CONFIG[this.timeframe] || LOOKBACK_CONFIG.Day;
      this.lookbackMessage = config.message;

      const computeStart = (anchor) => {
        if (!config.amount) return null;
        const ref = anchor || dayjs();
        return dayjs(ref).subtract(config.amount, config.unit).toISOString();
      };

      try {
        let datasets = [];
        let newLatest = null;

        if (this.sessionIds.length === 0) {
          const startDate = computeStart(this.latestRecord);
          const response = await agentApi.getCheckinsAgg(
            this.timeframe,
            startDate,
            null,
            null,
            signal,
          );
          if (mySeq !== this.fetchSeq) return;
          const records = response?.records || [];
          newLatest = this.maxCheckin(records);
          datasets = [this.buildDataset(records, "All Agents", null)];
        } else {
          const startDate = computeStart(this.latestRecord);
          const settled = await Promise.allSettled(
            this.sessionIds.map((sid) =>
              agentApi.getCheckinsAgg(
                this.timeframe,
                startDate,
                null,
                sid,
                signal,
              ),
            ),
          );
          if (mySeq !== this.fetchSeq) return;
          const failed = [];
          datasets = settled.map((result, idx) => {
            const sid = this.sessionIds[idx];
            const label = this.agentNameMap[sid] || sid;
            if (result.status === "rejected") {
              const err = result.reason;
              if (err?.name === "CanceledError" || err?.name === "AbortError") {
                return this.buildDataset([], label, sid);
              }
              failed.push(label);
              return this.buildDataset([], `${label} (failed)`, sid);
            }
            const records = result.value?.records || [];
            const localMax = this.maxCheckin(records);
            if (localMax && (!newLatest || localMax > newLatest)) {
              newLatest = localMax;
            }
            return this.buildDataset(records, label, sid);
          });
          this.failedAgents = failed;
        }

        if (newLatest) this.latestRecord = newLatest;
        this.chartData = { datasets };
      } catch (err) {
        if (mySeq !== this.fetchSeq) return;
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        const message = err?.message || String(err);
        this.errorMessage = `Failed to load checkin data: ${message}`;
        if (this.snack) this.snack.error(this.errorMessage);
      }
    },
    // TZ-safe: Empire emits Z-suffixed UTC ISO timestamps, so
    // dayjs(r.checkin_time).isAfter(max) compares absolute instants regardless
    // of the operator's local timezone. No .utc() normalization is required.
    maxCheckin(records) {
      let max = null;
      records.forEach((r) => {
        if (!r.checkin_time) return;
        if (!max || dayjs(r.checkin_time).isAfter(max)) {
          max = r.checkin_time;
        }
      });
      return max;
    },
    buildDataset(records, label, sid) {
      const color = colorForSession(sid);
      const data = records
        .filter((r) => r.checkin_time)
        .map((r) => ({
          // These records are server-aggregated with UTC bucket boundaries, so
          // for the Day view we keep the backend's date string as-is. Do NOT
          // use dayKey() here: re-deriving the day in local time would shift the
          // label +/- 1 day for operators far from UTC. Sub-day timeframes pass
          // the full TZ-aware ISO instant straight through to the time axis.
          x:
            this.timeframe === "Day"
              ? r.checkin_time.split("T")[0]
              : r.checkin_time,
          y: r.count,
        }));
      return {
        label,
        backgroundColor: color,
        borderColor: color,
        data,
      };
    },
  },
};
</script>
