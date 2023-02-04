<template>
  <div style="padding: 10px">
    <v-form
      v-if="agent.session_id"
      ref="form"
      v-model="valid"
    >
      <click-to-edit
        label="Session ID"
        :editable="false"
        :value="form.session_id"
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
        :value="form.external_ip"
        :editable="false"
      />
      <click-to-edit
        label="Internal IP"
        :value="form.internal_ip"
        :editable="false"
      />
      <click-to-edit
        label="Host Name"
        :value="form.hostname"
        :editable="false"
      />
      <click-to-edit
        label="Username"
        :value="form.username"
        :editable="false"
      />
      <click-to-edit
        v-model="form.listener"
        label="Listener"
        data-type="string"
        :suggested-values="listeners.map(l => l.name)"
        :strict="true"
        :editable="!readOnly"
        @update="updateListener"
      />
      <click-to-edit
        v-model="form.kill_date"
        label="Kill Date"
        data-type="date"
        :editable="!readOnly"
        @update="updateKillDate"
      />
      <click-to-edit
        v-model="form.working_hours"
        label="Working Hours"
        :rules="workingHoursRules"
        :editable="!readOnly"
        @update="updateWorkingHours"
      />
      <click-to-edit
        label="Check In Time"
        :value="moment(form.checkin_time).fromNow()"
        :editable="false"
      />
      <click-to-edit
        label="Last Seen Time"
        :value="moment(form.lastseen_time).fromNow()"
        :editable="false"
      />
      <click-to-edit
        v-model="form.delay"
        label="Delay"
        data-type="number"
        :rules="delayRules"
        :editable="!readOnly"
        @update="updateDelay"
      />
      <click-to-edit
        v-model="form.jitter"
        label="Jitter"
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
        :value="form.os_details"
        :editable="false"
      />
      <click-to-edit
        label="Architecture"
        :value="form.architecture"
        :editable="false"
      />
      <click-to-edit
        label="Process ID"
        :value="form.process_id"
        :editable="false"
      />
      <click-to-edit
        label="Process Name"
        :value="form.process_name"
        :editable="false"
      />
      <click-to-edit
        label="Language"
        :value="form.language"
        :editable="false"
      />
      <click-to-edit
        label="Language Version"
        :value="form.language_version"
        :editable="false"
      />
      <click-to-edit
        label="Profile"
        :value="form.profile"
        :editable="false"
      />
    </v-form>
  </div>
</template>

<script>
import Vue from 'vue';
import moment from 'moment';
import { mapState } from 'vuex';
import * as agentApi from '@/api/agent-api';
import ClickToEdit from '../ClickToEdit.vue';

export default {
  components: { ClickToEdit },
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
  data() {
    return {
      valid: true,
      nameLoading: false,
      loading: false,
      labelPosition: 'left',
      rules: {},
      form: {},
      moment,
      workingHoursRules: [
        (v) => /^[0-9]{1,2}:[0-5][0-9]-[0-9]{1,2}:[0-5][0-9]$/.test(v) || 'Must be in the format 00:00-24:00',
      ],
      nameRules: [
        (v) => !!v || 'Name is required',
        (v) => (!!v && v.length > 2) || 'Name must be at least 3 characters',
      ],
      jitterRules: [
        (v) => !Number.isNaN(v) || 'Jitter must be a number',
        (v) => (v >= 0 && v <= 1) || 'Jitter must be between 0 and 1',
      ],
      delayRules: [
        (v) => !Number.isNaN(v) || 'Delay must be a number',
        (v) => (v >= 0) || 'Delay must be a positive number',
      ],
    };
  },
  computed: {
    ...mapState({
      listeners: (state) => state.listener.listeners,
    }),
    fields() {
      // stale comes back as a boolean, while no other property does and el-input
      // doesn't accept booleans so this will do.
      return Object.keys(this.agent)
        .map((key) => ({
          name: key,
          Value: typeof this.agent[key] === 'boolean' ? `${this.agent[key]}` : this.agent[key],
        }));
    },
    /**
     * Following the same structure as the other forms, but in this case there are no
     * "requiredFields". It's just everything minus the name since we want that at the top.
     */
    requiredFields() {
      return this.fields
        .filter((el) => ['name'].indexOf(el.name) < 0);
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
          if (obj.name === 'kill_date' && obj.Value && obj.Value.length > 0) {
            const dateArr = obj.Value.split('/');
            const year = dateArr[2];
            const month = dateArr[0];
            const day = dateArr[1];
            map[obj.name] = `${year}-${month}-${day}`;
          } else {
            map[obj.name] = obj.Value;
          }
          return map;
        }, {});

        Vue.set(this, 'form', map2);
      },
    },
  },
  mounted() {
    this.$store.dispatch('listener/getListeners');
  },
  methods: {
    async updateName() {
      if (this.agent.name === this.form.name) return;

      try {
        await this.$store.dispatch('agent/rename', { sessionId: this.agent.session_id, newName: this.form.name });
      } catch (err) {
        this.$snack.error(`Update agent listener failed: ${err}`);
        return;
      }
      this.$snack.info(`Agent ${this.agent.name} name updated`);
    },
    async updateListener() {
      if (this.agent.listener === this.form.listener) return;

      try {
        const listenerId = this.listeners.filter((l) => l.name === this.form.listener)[0].id;
        await agentApi.updateComms(this.agent.session_id, listenerId);
      } catch (err) {
        this.$snack.error(`Update agent listener failed: ${err}`);
        return;
      }
      this.$snack.info(`Tasked agent to change listener to: ${this.form.listener}`);
      await this.$store.dispatch('agent/getAgent', { sessionId: this.form.name });
    },
    async updateKillDate() {
      let date = '';
      if (this.form.kill_date && this.form.kill_date.length > 0) {
        date = moment(this.form.kill_date).format('MM/DD/YYYY');
      }
      if (this.agent.kill_date === date) return;

      try {
        await agentApi.updateKillDate(this.agent.session_id, date);
      } catch (err) {
        this.$snack.error(`Update agent kill date failed: ${err}`);
        return;
      }
      this.$snack.info(`Tasked agent to change kill date to: ${date}`);
      this.$store.dispatch('agent/getAgent', { sessionId: this.form.name });
    },
    async updateWorkingHours() {
      if (this.agent.working_hours === this.form.working_hours) return;

      try {
        await agentApi.updateWorkingHours(this.agent.session_id, this.form.working_hours);
      } catch (err) {
        this.$snack.error(`Update agent working hours failed: ${err}`);
        return;
      }
      this.$snack.info(`Tasked agent to change working hours to: ${this.form.working_hours}`);
    },
    async updateDelay() {
      if (this.agent.delay === this.form.delay) return;

      try {
        await agentApi.updateSleep(this.agent.session_id, this.form.delay, this.form.jitter);
      } catch (err) {
        this.$snack.error(`Update agent delay failed: ${err}`);
        return;
      }
      this.$snack.info(`Tasked agent to change delay to: ${this.form.delay}`);
    },
    async updateJitter() {
      if (this.agent.jitter === this.form.jitter) return;

      try {
        await agentApi.updateSleep(this.agent.session_id, this.form.delay, this.form.jitter);
      } catch (err) {
        this.$snack.error(`Update agent delay failed: ${err}`);
        return;
      }
      this.$snack.info(`Tasked agent to change jitter to: ${this.form.jitter}`);
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
