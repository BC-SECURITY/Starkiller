<template>
  <div class="pa-4">
    <div class="d-flex align-center mb-4">
      <h3>Background Jobs</h3>
      <v-spacer />
      <v-btn
        size="small"
        color="primary"
        :loading="loading"
        @click="refreshJobs"
      >
        <v-icon start size="small">fa-sync</v-icon>
        Refresh
      </v-btn>
      <v-switch
        v-model="autoRefresh"
        color="primary"
        label="Auto-refresh"
        class="ml-4 mt-0"
        hide-details
      />
    </div>

    <v-alert
      v-if="error"
      type="error"
      closable
      class="mb-4"
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <v-alert
      v-if="successMessage"
      type="success"
      closable
      class="mb-4"
      @click:close="successMessage = null"
    >
      {{ successMessage }}
    </v-alert>

    <v-data-table
      v-model:expanded="expanded"
      :headers="headers"
      :items="jobs"
      :loading="loading"
      :items-per-page="10"
      item-value="id"
      show-expand
      class="elevation-1"
      no-data-text="No background jobs found. Jobs will appear here when you run modules with Background=true."
    >
      <template #item.status="{ item }">
        <v-chip :color="getStatusColor(item.agentStatus)" size="small">
          {{ item.agentStatus }}
        </v-chip>
      </template>

      <template #item.created_at="{ item }">
        {{ formatDate(item.created_at) }}
      </template>

      <template #item.actions="{ item }">
        <v-btn
          v-if="isKillable(item.agentStatus)"
          size="small"
          color="error"
          :loading="killingJob === item.id"
          @click="killJob(item)"
        >
          <v-icon start size="small">fa-stop</v-icon>
          Kill
        </v-btn>
        <span v-else class="text-grey">
          {{ item.agentStatus === "completed" ? "Completed" : "N/A" }}
        </span>
      </template>

      <template #item.input="{ item }">
        <span
          class="text-truncate"
          style="max-width: 300px; display: inline-block"
        >
          {{ truncateInput(item.input) }}
        </span>
      </template>

      <template #expanded-row="{ columns, item }">
        <td v-if="expandedJobs[item.id]" :colspan="columns.length" class="pa-4">
          <div>
            <div class="d-flex align-center mb-2">
              <v-btn
                size="x-small"
                variant="text"
                @click="
                  downloadText(item.input || '', `task-${item.id}-input.txt`)
                "
              >
                <v-icon start size="small">fa-download</v-icon>
                Download Input
              </v-btn>
              <v-btn
                size="x-small"
                variant="text"
                class="ml-2"
                @click="
                  downloadText(item.output || '', `task-${item.id}-output.txt`)
                "
              >
                <v-icon start size="small">fa-download</v-icon>
                Download Output
              </v-btn>
              <v-spacer />
              <v-switch
                v-model="expandedJobs[item.id].backgroundColor"
                color="primary"
                false-value="white"
                true-value="black"
                label="Dark Background"
                class="mt-0"
                hide-details
              />
            </div>

            <p><b>Full Input:</b></p>
            <p
              :class="
                'mono ' +
                (expandedJobs[item.id].backgroundColor === 'white'
                  ? 'font-black'
                  : 'font-white')
              "
              :style="
                'background-color: ' +
                expandedJobs[item.id].backgroundColor +
                ';'
              "
            >
              {{ item.input || "No input" }}
            </p>

            <p><b>Output:</b></p>
            <div
              :class="
                'mono ' +
                (expandedJobs[item.id].backgroundColor === 'white'
                  ? 'font-black'
                  : 'font-white')
              "
              :style="
                'background-color: ' +
                expandedJobs[item.id].backgroundColor +
                ';'
              "
            >
              <!-- eslint-disable vue/no-v-html -->
              <div
                v-if="expandedJobs[item.id].htmlOutput"
                v-html="expandedJobs[item.id].htmlOutput"
              />
              <div v-else>{{ item.output || "No output yet" }}</div>
            </div>
          </div>
        </td>
      </template>
    </v-data-table>

    <v-dialog v-model="confirmDialog" max-width="400">
      <v-card>
        <v-card-title>Confirm Kill Job</v-card-title>
        <v-card-text>
          Are you sure you want to kill job #{{ jobToKill?.id }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="confirmKillJob">Kill Job</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import moment from "moment";
// eslint-disable-next-line import/no-named-default
import { default as AnsiUp } from "ansi_up";
import * as agentTaskApi from "@/api/agent-task-api";
import pause from "@/utils/pause";
import DownloadMixin from "@/mixins/download-stager";

const KILLABLE_STATUSES = ["running", "started", "continuous"];
const ACTIVE_STATUSES = [...KILLABLE_STATUSES, "queued"];

const ansiUp = new AnsiUp();

export default {
  name: "AgentJobs",
  mixins: [DownloadMixin],
  props: {
    agent: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      jobs: [],
      loading: false,
      error: null,
      successMessage: null,
      autoRefresh: false,
      autoRefreshInterval: null,
      killRefreshTimeout: null,
      isDestroyed: false,
      killingJob: null,
      confirmDialog: false,
      jobToKill: null,
      expanded: [],
      expandedJobs: {},
      headers: [
        { title: "ID", key: "id", width: "80px" },
        { title: "Task Name", key: "task_name" },
        { title: "Status", key: "status", width: "120px" },
        { title: "Input", key: "input" },
        { title: "Created", key: "created_at", width: "180px" },
        { title: "Actions", key: "actions", sortable: false, width: "120px" },
      ],
    };
  },
  watch: {
    autoRefresh(val) {
      if (val) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    },
    agent: {
      handler() {
        this.refreshJobs();
      },
      immediate: true,
    },
  },
  beforeUnmount() {
    this.isDestroyed = true;
    this.stopAutoRefresh();
    if (this.killRefreshTimeout) {
      clearTimeout(this.killRefreshTimeout);
    }
  },
  methods: {
    async refreshJobs() {
      if (!this.agent?.session_id) return;
      if (this.loading) return;

      this.loading = true;
      this.error = null;

      try {
        // Request the agent to report its jobs, returns the task object
        const task = await agentTaskApi.getJobs(this.agent.session_id);

        // Poll for the task result using a delay based on agent check-in interval
        const pollDelay = Math.max(
          this.agent.delay != null ? this.agent.delay * 1000 : 5000,
          1000,
        );
        const maxAttempts = 30;
        let getJobsOutput = null;
        let consecutiveErrors = 0;

        for (let i = 0; i < maxAttempts; i++) {
          if (this.isDestroyed) return;
          // eslint-disable-next-line no-await-in-loop
          await pause(pollDelay);
          if (this.isDestroyed) return;
          try {
            // eslint-disable-next-line no-await-in-loop
            const result = await agentTaskApi.getTask(
              this.agent.session_id,
              task.id,
            );
            consecutiveErrors = 0;
            if (result.output) {
              getJobsOutput = result.output;
              break;
            }
          } catch (pollErr) {
            consecutiveErrors += 1;
            if (consecutiveErrors >= 3) {
              const detail =
                typeof pollErr === "string"
                  ? pollErr
                  : pollErr.message || "Unknown error";
              throw new Error(
                `Failed to poll for job results after ${consecutiveErrors} consecutive errors: ${detail}`,
              );
            }
          }
        }

        if (!getJobsOutput) {
          this.error =
            "Timed out waiting for agent to report jobs. " +
            "The agent may be offline or have a high check-in delay. Try refreshing again later.";
          this.jobs = [];
          return;
        }

        // Parse the TASK_GETJOBS output to extract background job information
        const agentJobs = this.parseGetJobsOutput(getJobsOutput);

        // Fetch tasks to match jobs with their creator tasks
        const response = await agentTaskApi.getTasks(this.agent.session_id, {
          limit: 100,
          page: 1,
          sortBy: "id",
          sortOrder: "desc",
          status: null,
        });

        // Build jobs array by matching agent jobs with their corresponding tasks
        this.jobs = agentJobs
          .map((agentJob) => {
            // Find the task that created this job
            const creatorTask = response.records.find((t) =>
              t.output?.includes(`Job started: ${agentJob.jobId}`),
            );

            return {
              id: agentJob.jobId,
              agentStatus: agentJob.status,
              task_name: creatorTask?.task_name ?? "Unknown",
              module_name: creatorTask?.module_name ?? null,
              input: creatorTask?.input ?? "Unknown",
              output: creatorTask?.output ?? "",
              created_at: creatorTask?.created_at ?? null,
              updated_at: creatorTask?.updated_at ?? null,
              taskId: creatorTask?.id ?? null,
            };
          })
          .filter((job) => ACTIVE_STATUSES.includes(job.agentStatus));

        // Clean up stale expandedJobs entries
        const activeJobIds = new Set(this.jobs.map((j) => j.id));
        Object.keys(this.expandedJobs).forEach((key) => {
          if (!activeJobIds.has(Number(key))) {
            delete this.expandedJobs[key];
          }
        });

        // Process each job for display
        this.jobs.forEach((job) => {
          const output = job.output || "";
          const htmlOutput = this.hasAnsi(output)
            ? ansiUp.ansi_to_html(output)
            : null;

          if (!this.expandedJobs[job.id]) {
            this.expandedJobs[job.id] = {
              backgroundColor: "black",
              htmlOutput,
            };
          } else {
            this.expandedJobs[job.id].htmlOutput = htmlOutput;
          }
        });
      } catch (err) {
        const detail =
          typeof err === "string" ? err : err.message || "Unknown error";
        this.error = `Failed to fetch jobs: ${detail}`;
      } finally {
        this.loading = false;
      }
    },
    parseGetJobsOutput(output) {
      // Parse the table output from TASK_GETJOBS.
      // The agent labels the column "Task ID" but it actually represents the
      // background job/thread ID, stored here as jobId.
      // Note: this format is specific to Empire's TASK_GETJOBS output and may vary by agent language.
      // Expected format:
      // Task ID | Status
      // --------------------
      // 27 | started
      // 1 | running
      const lines = output
        .split("\n")
        .filter(
          (line) =>
            line.trim() && !line.includes("Task ID") && !line.includes("---"),
        );

      const parsed = lines
        .map((line) => line.match(/^\s*(\d+)\s*\|\s*(\w+)\s*$/))
        .filter((match) => match != null)
        .map((match) => ({
          jobId: parseInt(match[1], 10),
          status: match[2],
        }));

      if (lines.length > 0 && parsed.length === 0) {
        this.error =
          "Received job data from agent but could not parse it. " +
          "The agent may be running an incompatible version.";
      }

      return parsed;
    },
    killJob(job) {
      this.jobToKill = job;
      this.confirmDialog = true;
    },
    async confirmKillJob() {
      if (!this.jobToKill) return;

      const job = this.jobToKill;
      this.confirmDialog = false;
      this.killingJob = job.id;
      this.error = null;

      try {
        await agentTaskApi.killJob(this.agent.session_id, job.id);
        this.successMessage = `Kill command sent for job #${job.id}. The job will be stopped on the agent's next check-in.`;
        if (!this.autoRefresh) {
          this.killRefreshTimeout = setTimeout(() => this.refreshJobs(), 3000);
        }
      } catch (err) {
        const detail =
          typeof err === "string"
            ? err
            : err.message || `Failed to kill job #${job.id}`;
        this.error = detail;
      } finally {
        this.killingJob = null;
        this.jobToKill = null;
      }
    },
    startAutoRefresh() {
      this.stopAutoRefresh();
      const loop = async () => {
        if (!this.autoRefresh || this.isDestroyed) return;
        await this.refreshJobs();
        if (this.autoRefresh && !this.isDestroyed) {
          // Schedule next refresh after current one completes to avoid stacking
          this.autoRefreshInterval = setTimeout(loop, 10000);
        }
      };
      this.autoRefreshInterval = setTimeout(loop, 10000);
    },
    stopAutoRefresh() {
      if (this.autoRefreshInterval) {
        clearTimeout(this.autoRefreshInterval);
        this.autoRefreshInterval = null;
      }
    },
    getStatusColor(status) {
      const colors = {
        queued: "orange",
        pulled: "blue",
        running: "blue",
        started: "orange",
        completed: "green",
        error: "red",
        continuous: "purple",
      };
      return colors[status] || "grey";
    },
    formatDate(date) {
      if (!date) return "N/A";
      return moment(date).format("YYYY-MM-DD HH:mm:ss");
    },
    truncateInput(input) {
      if (!input) return "";
      return input.length > 50 ? `${input.substring(0, 50)}...` : input;
    },
    isKillable(status) {
      return KILLABLE_STATUSES.includes(status);
    },
    hasAnsi(text) {
      return text.includes("\u001b") || text.includes("\u009b");
    },
  },
};
</script>

<!-- Unscoped so styles apply inside v-html rendered ANSI output content -->
<style>
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mono {
  white-space: pre-wrap;
  font:
    1.1em "Andale Mono",
    Consolas,
    "Courier New";
  font-weight: bold;
  line-height: 1.6em;
  text-align: left;
}

.font-white {
  color: white;
}

.font-black {
  color: black;
}
</style>
