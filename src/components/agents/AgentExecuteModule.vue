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
        :info-array="moduleInfoArray"
      />
      <technique-chips :techniques="selectedItem.Techniques" />
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
    };
  },
  computed: {
    ...mapState({
      modules: (state) => state.module.modules
        .filter((el) => el.Enabled === true),
      selectOptions: (state) => state.module.modules
        .filter((el) => el.Enabled === true)
        .map((el) => el.Name),
    }),
    moduleOptions() {
      let { options } = this.selectedItem;
      options = options || {};
      if (options && options.Agent) {
        delete options.Agent;
      }

      Object.keys(this.moduleOptionDefaults || {}).forEach((key) => {
        if (options[key]) {
          options[key].Value = this.moduleOptionDefaults[key];
        }
      });

      return options;
    },
    moduleInfoArray() {
      if (Object.keys(this.selectedItem).length === 0) {
        return [];
      }

      return [
        { key: 'Author', value: this.selectedItem.Author.join(', ') },
        { key: 'Comments', value: this.selectedItem.Comments.join('\n') },
        { key: 'Description', value: this.selectedItem.Description },
        { key: 'Language', value: this.selectedItem.Language },
        { key: 'MinLanguageVersion', value: this.selectedItem.MinLanguageVersion },
        { key: 'Background', value: this.selectedItem.Background },
        { key: 'OpsecSafe', value: this.selectedItem.OpsecSafe },
        { key: 'NeedsAdmin', value: this.selectedItem.NeedsAdmin },
        { key: 'OutputExtensions', value: this.selectedItem.OutputExtensions },
      ];
    },
    errorStateMessage() {
      return `The resource 'module/${this.moduleName}' Not Found or is Disabled.`;
    },
  },
  watch: {
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
      if (item === '' || item == null) {
        this.reset = false;
        this.selectedItem = {};
        setTimeout(() => { this.reset = true; }, 500);
        return;
      }
      const results = this.modules.find((el) => el.Name === item);
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
        .map((agent) => moduleApi.executeModule(this.selectedModule,
          { ...this.form, Agent: agent })));

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
      }

      this.selectedItem = {};
      this.selectedModule = '';
      this.loading = false;

      // emit a submitted event so ModuleExecute can clear agents list.
      this.$emit('submitted');
    },
  },
};
</script>

<style lang="scss" scoped>
.red {
  background-color: #bd4c4c;
}
</style>
