<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-refresh="true"
      :refresh-loading="loadingStatus === 'loading'"
      @refresh="refreshAll"
    />
    <v-row class="ml-1 mr-1">
      <v-col
        v-for="metric in toplineMetrics"
        :key="metric.title"
        cols="12"
        sm="4"
        md="4"
      >
        <v-card class="mx-auto">
          <v-card-title>{{ metric.title }}</v-card-title>
          <v-card-text class="text-center">
            <h1 style="color: limegreen">
              {{ metric.value }}
            </h1>
          </v-card-text>
          <v-card-actions>
            <v-btn color="secondary" text :to="metric.route"> View </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row class="ml-1 mr-1">
      <v-col cols="12" sm="4" md="4">
        <v-card class="mx-auto">
          <v-card-title> Agents </v-card-title>
          <v-card-text class="text-center">
            <Doughnut
              v-if="agentDonut.chartData"
              :data="agentDonut.chartData"
              :options="agentDonut.chartOptions"
            />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="8" md="8">
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
        <v-card class="mx-auto" min-height="350px">
          <v-card-title style="display: flex; justify-content: space-between">
            <span>Check Ins</span>
            <span>{{ lookbackMessage }}</span>
            <div style="width: 100px">
              <v-select
                v-model="checkinMetrics.timeframe"
                :items="['Second', 'Minute', 'Hour', 'Day']"
              />
            </div>
          </v-card-title>
          <v-card-text class="text-center">
            <Bar
              v-if="showCheckins"
              height="350px"
              :data="checkinMetrics.chartData"
              :options="checkinMetrics.chartOptions"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { Bar, Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  TimeSeriesScale,
} from "chart.js";
import "chartjs-adapter-dayjs-4";
import dayjs from "@/plugins/dayjs";

import * as agentApi from "@/api/agent-api";
import AgentTasksTable from "@/components/agents/AgentTasksTable.vue";
import ListPageTop from "@/components/ListPageTop.vue";
import { useListenerStore } from "@/stores/listener-module";
import { useAgentStore } from "@/stores/agent-module";
import { useCredentialStore } from "@/stores/credential-module";

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  TimeSeriesScale,
);

export default {
  name: "Dashboard",
  components: {
    ListPageTop,
    AgentTasksTable,
    Bar,
    Doughnut,
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
      lookbackMessage: "",
      latestRecord: null,
      showCheckins: true,
      checkinMetrics: {
        title: "Agent Checkins",
        timeframe: "Day",
        chartData: {
          labels: [],
          datasets: [
            {
              label: "Checkins",
              backgroundColor: "#f87979",
              data: [],
            },
          ],
        },
        chartOptions: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: "time",
              time: {
                unit: "day",
                displayFormats: {
                  hour: "MMM D hA",
                  minute: "MMM D hh:mmA",
                  second: "MMM D hh:mm:ssA",
                },
              },
            },
          },
        },
      },
    };
  },
  computed: {
    listenerStore() {
      return useListenerStore();
    },
    agentStore() {
      return useAgentStore();
    },
    credentialStore() {
      return useCredentialStore();
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
    agentDonut() {
      if (!this.agents) {
        return {};
      }
      const languages = this.agents.reduce((acc, agent) => {
        acc[agent.language] = (acc[agent.language] || 0) + 1;
        return acc;
      }, {});
      const labels = Object.keys(languages);
      const data = Object.values(languages);
      return {
        chartData: {
          labels,
          datasets: [
            {
              backgroundColor: [
                "#41B883",
                "#E46651",
                "#00D8FF",
                "#DD1B16",
                "#FFCE56",
              ],
              data,
            },
          ],
        },
        chartOptions: {
          responsive: true,
        },
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
  watch: {
    "checkinMetrics.timeframe": {
      handler(val) {
        this.getCheckinsAgg(val);
      },
    },
  },
  async mounted() {
    await this.refreshAll();
  },
  methods: {
    async refreshAll() {
      this.loadingStatus = "loading";
      try {
        await Promise.all([
          this.agentStore.getAgents(),
          this.credentialStore.getCredentials(),
          this.listenerStore.getListeners(),
          this.getTasks(),
        ]);

        try {
          const lastCheckin = await agentApi.getCheckinsLast();
          this.latestRecord = lastCheckin?.checkin_time ?? null;
        } catch {
          this.latestRecord = null;
        }

        await this.getCheckinsAgg(this.checkinMetrics.timeframe);
      } finally {
        this.loadingStatus = "complete";
      }
    },
    async getTasks() {
      this.refreshTasks = true;
      await this.$nextTick();
      this.refreshTasks = false;
    },
    async getCheckinsAgg(bucketSize = "Day") {
      const lookbackConfig = {
        Day: { amount: null, unit: null, message: "" },
        Hour: { amount: 24, unit: "hours", message: "Last 24 Hours" },
        Minute: { amount: 30, unit: "minutes", message: "Last 30 Minutes" },
        Second: { amount: 1, unit: "minutes", message: "Last 60 Seconds" },
      };

      let startDate = null;
      const config = lookbackConfig[bucketSize];
      if (config) {
        this.lookbackMessage = config.message;
        if (config.amount && this.latestRecord) {
          startDate = dayjs(this.latestRecord)
            .subtract(config.amount, config.unit)
            .toISOString();
        }
      }

      let checkinsAgg;
      try {
        checkinsAgg = await agentApi.getCheckinsAgg(bucketSize, startDate);
      } catch (err) {
        this.snack.error(`Failed to load checkin data: ${err.message || err}`);
        return;
      }

      if (
        !this.latestRecord &&
        checkinsAgg.records &&
        checkinsAgg.records.length > 0
      ) {
        this.latestRecord =
          checkinsAgg.records[checkinsAgg.records.length - 1].checkin_time;
      }

      const records = (checkinsAgg.records || []).map((record) => ({
        ...record,
        checkin_time:
          bucketSize === "Day"
            ? (record.checkin_time ?? "").split("T")[0]
            : (record.checkin_time ?? ""),
      }));

      this.checkinMetrics.chartData.labels = records.map((r) => r.checkin_time);
      this.checkinMetrics.chartData.datasets[0].data = records.map(
        (r) => r.count,
      );
      this.checkinMetrics.chartOptions.scales.x.time.unit =
        bucketSize.toLowerCase();
      this.showCheckins = false;

      this.$nextTick(() => {
        this.showCheckins = true;
      });
    },
  },
};
</script>

<style></style>
