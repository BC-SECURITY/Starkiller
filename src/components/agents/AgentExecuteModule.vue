<template>
  <div>
    <error-state-alert
      v-if="errorState"
      :resource-id="moduleName"
      resource-type="module"
      :message="errorStateMessage"
    />
    <div
      v-else
      style="padding: 0 10px 10px 10px"
    >
      <info-viewer
        class="info-viewer"
        :info="moduleInfo"
      />
      <!-- todo could make this more friendly by looking up the "name" in the state in case it was changed -->
      <span class="mr-2 mb-4">Executing on Agents: {{ agents.join(', ') }}</span>
      <technique-chips :techniques="selectedItem.techniques" />
      <v-autocomplete
        v-model="selectedModule"
        :items="selectOptions"
        :loading="!reset"
        placeholder="Please enter a module name"
        outlined
        dense
        clearable
        @change="handleSelect"
      />
      <v-alert
        v-if="selectedItem.opsec_safe === false"
        type="warning"
      >
        <v-row align="center">
          <v-col
            class="grow"
            style="word-wrap: word-break; width: 500px"
          >
            This module is not opsec safe.
          </v-col>
        </v-row>
      </v-alert>
      <div style="display: flex; flex-direction: row;">
        <v-checkbox
          v-model="ignoreAdminCheck"
          class="pa-1"
          label="Ignore Admin Check"
          color="primary"
        />
        <v-checkbox
          v-model="ignoreLanguageCheck"
          class="pa-1"
          label="Ignore Language Version Check"
          color="primary"
        />
      </div>
      <general-form
        v-if="reset"
        ref="generalform"
        v-model="form"
        :options="moduleOptions"
      />
      <v-btn
        v-if="showSubmit"
        :loading="loading"
        color="primary"
        @click="create"
      >
        Submit
      </v-btn>
      <v-dialog
        ref="nameDialog"
        v-model="showDialog"
        max-width="900px"
      >
        <v-card>
          <v-card-title>
            <span class="headline">Execution Result</span>
          </v-card-title>
          <v-card-text>
            <v-data-table
              dense
              :items="results"
              :headers="headers"
              :item-class="rowClass"
            >
              <template #item.agent="{ item }">
                <div>
                  <template v-if="item.status === 'rejected'">
                    <span>{{ item.reason.agent }}</span>
                  </template>
                  <template v-else>
                    <span>{{ item.value.agent }}</span>
                  </template>
                </div>
              </template>
              <template #item.result="{ item }">
                <div>
                  <template v-if="item.status === 'rejected'">
                    <span>{{ item.reason.error }}</span>
                  </template>
                  <template v-else>
                    <span>{{ item.value.message }}</span>
                  </template>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="blue darken-1"
              text
              @click="showDialog = false"
            >
              Okay
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import InfoViewer from '@/components/InfoViewer.vue';
import * as moduleApi from '@/api/module-api';
import ErrorStateAlert from '@/components/ErrorStateAlert.vue';
import GeneralForm from '../GeneralForm.vue';
import TechniqueChips from '../TechniqueChips.vue';

export default {
  components: {
    InfoViewer,
    GeneralForm,
    TechniqueChips,
    ErrorStateAlert,
  },
  props: {
    agents: {
      type: Array,
      default: () => [],
    },
    showSubmit: {
      type: Boolean,
      default: true,
    },
    moduleName: {
      type: String,
      default: '',
    },
    moduleOptionDefaults: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      loading: false,
      selectedModule: '',
      selectedItem: {},
      results: [],
      reset: true,
      headers: [
        { text: 'Agent', value: 'agent' },
        { text: 'Result', value: 'result' },
      ],
      showDialog: false,
      form: {},
      errorState: false,
      ignoreAdminCheck: false,
      ignoreLanguageCheck: false,
    };
  },
  computed: {
    ...mapState({
      modules: (state) => state.module.modules
        .filter((el) => el.enabled === true),
      selectOptions: (state) => state.module.modules
        .filter((el) => el.enabled === true)
        .map((el) => el.id),
    }),
    moduleOptions() {
      let { options } = this.selectedItem;
      options = options || {};
      if (options && options.Agent) {
        delete options.Agent;
      }

      Object.keys(this.moduleOptionDefaults || {}).forEach((key) => {
        if (options[key]) {
          options[key].value = this.moduleOptionDefaults[key];
        }
      });

      return options;
    },
    moduleInfo() {
      if (Object.keys(this.selectedItem).length === 0) {
        return {};
      }

      return {
        authors: this.selectedItem.authors,
        description: this.selectedItem.description,
        comments: this.selectedItem.comments,
        extraDetails: [
          { key: 'Language', value: this.selectedItem.language },
          { key: 'MinLanguageVersion', value: this.selectedItem.min_language_version },
          { key: 'Background', value: this.selectedItem.background },
          { key: 'OpsecSafe', value: this.selectedItem.opsec_safe },
          { key: 'NeedsAdmin', value: this.selectedItem.needs_admin },
          { key: 'OutputExtensions', value: this.selectedItem.output_extensions },
        ],
      };
    },
    errorStateMessage() {
      return `The resource 'module/${this.moduleName}' Not Found or is Disabled.`;
    },
  },
  watch: {
    modules(val) {
      if (val.length > 0) {
        this.handleSelect(this.moduleName);
      }
    },
    selectedModule(newVal) {
      this.emitModuleChange(newVal);
    },
    moduleName: {
      immediate: true,
      handler(newVal) {
        this.selectedModule = newVal;
        this.handleSelect(newVal);
      },
    },
  },
  async mounted() {
    this.$store.dispatch('module/getModules');
  },
  methods: {
    async handleSelect(item) {
      this.errorState = false;
      if (item === '' || item == null) {
        this.reset = false;
        this.selectedItem = {};
        setTimeout(() => { this.reset = true; }, 500);
        return;
      }
      const results = this.modules.find((el) => el.id === item);
      this.reset = false;
      this.selectedItem = results || {};
      if (Object.keys(this.selectedItem).length === 0) {
        this.errorState = true;
      }
      setTimeout(() => { this.reset = true; }, 500);
    },
    rowClass(item) {
      if (item.status === 'rejected') return 'red';
      return '';
    },
    emitModuleChange(newVal) {
      this.$emit('moduleChange', newVal);
    },
    validate() {
      return this.$refs.generalform.$refs.form.validate();
    },
    async create() {
      if (this.agents.length < 1 || this.loading || !this.validate()) {
        return;
      }

      this.loading = true;

      const result = await Promise.allSettled(this.agents
        .map((agent) => moduleApi.executeModule(
          this.selectedModule,
          {
            ...this.form,
            Agent: agent,
          },
          this.ignoreAdminCheck,
          this.ignoreLanguageCheck,
        )));

      if (result.some((item) => item.status === 'rejected')) {
        const split = result.reduce((acc, val) => {
          acc[val.status].push(val);
          return acc;
        }, { rejected: [], fulfilled: [] });

        if (this.agents.length > 1) {
          this.$snack.warn(`Module failed to execute for ${split.rejected.length} out of ${this.agents.length} agents.`);
          this.results = result;
          this.showDialog = true;
        } else {
          this.$snack.error(`Error: ${result[0].reason.error}`);
        }
      } else {
        const displayName = this.agents.length > 1 ? `${this.agents.length} agents.` : `${this.agents[0]}.`;
        this.$snack.info(`Module execution queued for ${displayName}`);
        this.selectedItem = {};
        this.selectedModule = '';
        // emit a submitted event so ModuleExecute can clear agents list.
        this.$emit('submitted');
      }

      this.loading = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.red {
  background-color: #bd4c4c;
}
</style>
