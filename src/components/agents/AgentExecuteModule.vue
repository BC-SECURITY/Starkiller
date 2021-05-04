<template>
  <div style="padding: 0 10px 10px 10px">
    <info-viewer
      class="info-viewer"
      :info-array="moduleInfoArray"
    />
    <div
      v-if="selectedItem.Techniques"
      class="flex flex-row flex-wrap mb-2"
    >
      <span class="mr-2">Techniques:</span>
      <v-chip
        v-for="tech in selectedItem.Techniques"
        :key="tech"
        small
        :href="`https://attack.mitre.org/techniques/${tech}`"
        target="_blank"
        color="green"
        class="mr-1 mb-1"
        @click.native="openExternalBrowser"
      >
        {{ tech }}
      </v-chip>
    </div>
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
      :options="moduleOptions"
      :loading="loading"
      @submit="create"
    />
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
            <template v-slot:item.agent="{ item }">
              <div>
                <template v-if="item.status === 'rejected'">
                  <span>{{ item.reason.agent }}</span>
                </template>
                <template v-else>
                  <span>{{ item.value.agent }}</span>
                </template>
              </div>
            </template>
            <template v-slot:item.result="{ item }">
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
</template>

<script>
import { mapState } from 'vuex';
import InfoViewer from '@/components/InfoViewer.vue';
import * as moduleApi from '@/api/module-api';
import openExternalBrowser from '@/mixins/open-external';
import GeneralForm from '../GeneralForm.vue';

export default {
  components: {
    InfoViewer,
    GeneralForm,
  },
  mixins: [openExternalBrowser],
  /**
   * can bind moduleName with v-model
   */
  model: {
    prop: 'moduleName',
    event: 'modified',
  },
  props: {
    agents: {
      type: Array,
      default: () => [],
    },
    moduleName: {
      type: String,
      default: '',
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
    };
  },
  computed: {
    ...mapState({
      modules: state => state.module.modules,
      selectOptions: state => state.module.modules.map(el => el.Name),
    }),
    moduleOptions() {
      let { options } = this.selectedItem;
      options = options || {};
      if (options && options.Agent) {
        delete options.Agent;
      }
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
      const results = this.modules.find(el => el.Name === item);
      this.reset = false;
      this.selectedItem = results || {};
      setTimeout(() => { this.reset = true; }, 500);
    },
    rowClass(item) {
      if (item.status === 'rejected') return 'red';
      return '';
    },
    emitModuleChange(newVal) {
      this.$emit('modified', newVal);
    },
    async create(form) {
      if (this.agents.length < 1 || this.loading) {
        return;
      }

      this.loading = true;

      const result = await Promise.allSettled(this.agents
        .map(agent => moduleApi.executeModule(this.selectedModule,
          { ...form, Agent: agent })));

      if (result.some(item => item.status === 'rejected')) {
        const split = result.reduce((acc, val) => {
          acc[val.status].push(val);
          return acc;
        }, { rejected: [], fulfilled: [] });

        if (this.agents.length > 1) {
          this.$toast.warning(`Module failed to execute for ${split.rejected.length} out of ${this.agents.length} agents.`);
          this.results = result;
          this.showDialog = true;
        } else {
          this.$toast.error(`Error: ${result[0].reason.error}`);
        }
      } else {
        const displayName = this.agents.length > 1 ? `${this.agents.length} agents.` : `${this.agents[0]}.`;
        this.$toast.success(`Module execution queued for ${displayName}`);
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
