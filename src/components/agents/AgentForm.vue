<template>
  <div style="padding: 10px">
    <tag-viewer
      :tags="agent.tags"
      @attach-tag="addTag"
      @detach-tag="deleteTag"
    />
    <v-form v-if="agent.session_id" ref="form" v-model="valid">
      <click-to-edit
        label="Session ID"
        :editable="false"
        :model-value="form.session_id"
      />
      <click-to-edit
        v-model="form.name"
        label="Name"
        :rules="nameRules"
        :editable="!readOnly"
        @update="updateName"
      />
      <click-to-edit
        label="External IP"
        :model-value="form.external_ip"
        :editable="false"
      />
      <click-to-edit
        label="Internal IP"
        :model-value="form.internal_ip"
        :editable="false"
      />
      <click-to-edit
        label="Host Name"
        :model-value="form.hostname"
        :editable="false"
      />
      <click-to-edit
        label="Username"
        :model-value="form.username"
        :editable="false"
      />
      <click-to-edit
        label="Listener"
        :model-value="form.listener"
        :editable="false"
      />
      <click-to-edit
        v-model="form.kill_date"
        label="Kill Date"
        data-type="date"
        info-text="Date format: YYYY-MM-DD"
        :editable="!readOnly"
        @update="updateKillDate"
      />
      <click-to-edit
        v-model="form.working_hours"
        label="Working Hours"
        info-text="Format: 00:00-24:00"
        :rules="workingHoursRules"
        :editable="!readOnly"
        @update="updateWorkingHours"
      />
      <click-to-edit
        label="Check In Time"
        :model-value="relativeTime(form.checkin_time)"
        :editable="false"
      />
      <click-to-edit
        label="Last Seen Time"
        :model-value="relativeTime(form.lastseen_time)"
        :editable="false"
      />
      <click-to-edit
        v-model="form.delay"
        label="Delay"
        info-text="Delay in seconds before the agent checks in"
        data-type="number"
        :rules="delayRules"
        :editable="!readOnly"
        @update="updateDelay"
      />
      <click-to-edit
        v-model="form.jitter"
        label="Jitter"
        info-text="Randomness in delay as a decimal between 0 and 1"
        data-type="number"
        :rules="jitterRules"
        :editable="!readOnly"
        @update="updateJitter"
      />
      <click-to-edit
        v-model="form.lost_limit"
        label="Lost Limit"
        data-type="number"
        :editable="false"
      />
      <click-to-edit
        label="OS Details"
        :model-value="form.os_details"
        :editable="false"
      />
      <click-to-edit
        label="Architecture"
        :model-value="form.architecture"
        :editable="false"
      />
      <click-to-edit
        label="Process ID"
        :model-value="form.process_id"
        :editable="false"
      />
      <click-to-edit
        label="Process Name"
        :model-value="form.process_name"
        :editable="false"
      />
      <click-to-edit
        label="Language"
        :model-value="form.language"
        :editable="false"
      />
      <click-to-edit
        label="Language Version"
        :model-value="form.language_version"
        :editable="false"
      />
      <click-to-edit
        label="Profile"
        :model-value="form.profile"
        :editable="false"
      />
    </v-form>
  </div>
</template>

<script>
import dayjs from "@/plugins/dayjs";
import TagViewer from "@/components/TagViewer.vue";
import ClickToEdit from "@/components/ClickToEdit.vue";
import * as agentTaskApi from "@/api/agent-task-api";
import * as agentApi from "@/api/agent-api";
import { useAgentStore } from "@/stores/agent-module";

export default {
  components: { TagViewer, ClickToEdit },
  inject: ["snack"],
  props: {
    /**
     * The agent object to populate the form fields.
     */
    agent: {
      type: Object,
      required: true,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["refresh-agent"],
  data() {
    return {
      valid: true,
      nameLoading: false,
      loading: false,
      labelPosition: "left",
      rules: {},
      form: {},
      workingHoursRules: [
        (v) =>
          /^[0-9]{1,2}:[0-5][0-9]-[0-9]{1,2}:[0-5][0-9]$/.test(v) ||
          "Must be in the format 00:00-24:00",
      ],
      nameRules: [
        (v) => !!v || "Name is required",
        (v) => (!!v && v.length > 2) || "Name must be at least 3 characters",
      ],
      jitterRules: [
        (v) => !Number.isNaN(v) || "Jitter must be a number",
        (v) => (v >= 0 && v <= 1) || "Jitter must be between 0 and 1",
      ],
      delayRules: [
        (v) => !Number.isNaN(v) || "Delay must be a number",
        (v) => v >= 0 || "Delay must be a positive number",
      ],
    };
  },
  computed: {
    agentStore() {
      return useAgentStore();
    },
    fields() {
      // stale comes back as a boolean, while no other property does and el-input
      // doesn't accept booleans so this will do.
      return Object.keys(this.agent).map((key) => ({
        name: key,
        Value:
          typeof this.agent[key] === "boolean"
            ? `${this.agent[key]}`
            : this.agent[key],
      }));
    },
    /**
     * Following the same structure as the other forms, but in this case there are no
     * "requiredFields". It's just everything minus the name since we want that at the top.
     */
    requiredFields() {
      return this.fields.filter((el) => ["name"].indexOf(el.name) < 0);
    },
  },
  watch: {
    /**
     * When the fields change, we update the form map and set it for reaactivity to take place.
     */
    fields: {
      immediate: true,
      handler(arr) {
        const map2 = arr.reduce((map, obj) => {
          if (obj.name === "kill_date" && obj.Value && obj.Value.length > 0) {
            const dateArr = obj.Value.split("/");
            const year = dateArr[2];
            const month = dateArr[0];
            const day = dateArr[1];
            map[obj.name] = `${year}-${month}-${day}`;
          } else {
            map[obj.name] = obj.Value;
          }
          return map;
        }, {});

        this.form = map2;
      },
    },
  },
  methods: {
    // dayjs(null|"") is "valid" and yields a bogus relative time (moment
    // rendered "Invalid date"); guard so an unparseable timestamp shows a
    // placeholder. dayjs(undefined) stays valid (= now), matching moment.
    relativeTime(value) {
      const parsed = dayjs(value);
      return parsed.isValid() ? parsed.fromNow() : "N/A";
    },
    deleteTag(tag) {
      agentApi
        .deleteTag(this.agent.session_id, tag.id)
        .then(() => {
          this.$emit("refresh-agent");
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    addTag(payload) {
      agentApi
        .addTag(this.agent.session_id, payload)
        .then(() => {
          this.$emit("refresh-agent");
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    async updateName() {
      if (this.agent.name === this.form.name) return;

      try {
        await this.agentStore.rename({
          sessionId: this.agent.session_id,
          newName: this.form.name,
        });
      } catch (err) {
        this.snack.error(`Update agent name failed: ${err}`);
        return;
      }
      this.snack.info(`Agent ${this.agent.name} name updated`);
      this.$emit("refresh-agent");
    },
    async updateKillDate() {
      let date = "";
      if (this.form.kill_date && this.form.kill_date.length > 0) {
        date = dayjs(this.form.kill_date).format("MM/DD/YYYY");
      }
      if (this.agent.kill_date === date) return;

      try {
        await agentTaskApi.updateKillDate(this.agent.session_id, date);
      } catch (err) {
        this.snack.error(`Update agent kill date failed: ${err}`);
        return;
      }
      this.snack.info(`Tasked agent to change kill date to: ${date}`);
      this.$emit("refresh-agent");
    },
    async updateWorkingHours() {
      if (this.agent.working_hours === this.form.working_hours) return;

      try {
        await agentTaskApi.updateWorkingHours(
          this.agent.session_id,
          this.form.working_hours,
        );
      } catch (err) {
        this.snack.error(`Update agent working hours failed: ${err}`);
        return;
      }
      this.snack.info(
        `Tasked agent to change working hours to: ${this.form.working_hours}`,
      );
      this.$emit("refresh-agent");
    },
    async updateDelay() {
      if (this.agent.delay === this.form.delay) return;

      try {
        await agentTaskApi.updateSleep(
          this.agent.session_id,
          this.form.delay,
          this.form.jitter,
        );
      } catch (err) {
        this.snack.error(`Update agent delay failed: ${err}`);
        return;
      }
      this.snack.info(`Tasked agent to change delay to: ${this.form.delay}`);
      this.$emit("refresh-agent");
    },
    async updateJitter() {
      if (this.agent.jitter === this.form.jitter) return;

      try {
        await agentTaskApi.updateSleep(
          this.agent.session_id,
          this.form.delay,
          this.form.jitter,
        );
      } catch (err) {
        this.snack.error(`Update agent delay failed: ${err}`);
        return;
      }
      this.snack.info(`Tasked agent to change jitter to: ${this.form.jitter}`);
      this.$emit("refresh-agent");
    },
    fieldExists(name) {
      return this.fields.filter((el) => el.name === name).length > 0;
    },
  },
};
</script>

<style lang="scss" scoped>
.form {
  max-width: 600px;
  width: 100%;
}
</style>
