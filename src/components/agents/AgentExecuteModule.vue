<template>
  <div style="padding: 0 10px 10px 10px">
    <info-viewer
      class="info-viewer"
      :info-array="moduleInfoArray"
    />
    <v-form
      ref="form"
      @submit.prevent.native="submit"
    >
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
        placeholder="Please enter a module name"
        outlined
        dense
        clearable
        @change="handleSelect"
      />
      <v-autocomplete
        v-if="fieldExists('Listener')"
        v-model="form.Listener"
        :rules="rules['Listener']"
        label="Listener"
        :items="listeners"
        outlined
        dense
        required
      />
      <v-text-field
        v-for="field in requiredFields"
        :key="field.name"
        v-model="form[field.name]"
        :rules="rules[field.name]"
        :label="field.name"
        :type="field.type === 'string' ? 'text' : 'number'"
        outlined
        dense
      />
      <v-expansion-panels v-if="optionalFields.length > 0">
        <v-expansion-panel>
          <v-expansion-panel-header>Optional Fields</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-text-field
              v-for="field in optionalFields"
              :key="field.name"
              v-model="form[field.name]"
              :rules="rules[field.name]"
              :label="field.name"
              :type="field.type === 'string' ? 'text' : 'number'"
              outlined
              dense
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
      <div>
        <v-btn
          type="submit"
          color="primary"
          class="mt-4"
          :disabled="agents.length < 1"
          :loading="loading"
        >
          Submit
        </v-btn>
      </div>
    </v-form>
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
import Vue from 'vue';
import { mapState } from 'vuex';
import InfoViewer from '@/components/InfoViewer.vue';
import * as moduleApi from '@/api/module-api';
import openExternalBrowser from '@/mixins/open-external';

export default {
  components: {
    InfoViewer,
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
      form: {},
      results: [],
      headers: [
        { text: 'Agent', value: 'agent' },
        { text: 'Result', value: 'result' },
      ],
      showDialog: false,
    };
  },
  computed: {
    ...mapState({
      selectOptions: state => state.module.modules.map(el => el.Name),
      listeners: state => state.listener.listeners.map(el => el.name),
    }),
    fields() {
      if (Object.keys(this.selectedItem).length < 1) {
        return [];
      }

      return Object.keys(this.selectedItem.options)
        .filter(el => ['Agent', 'Listener'].indexOf(el.name) < 0)
        .map(key => ({ name: key, ...this.selectedItem.options[key] }));
    },
    requiredFields() {
      return this.fields
        .filter(el => ['Agent', 'Listener'].indexOf(el.name) < 0)
        .filter(el => el.Required === true)
        .map(el => ({ ...el, type: this.fieldType(el) }));
    },
    optionalFields() {
      return this.fields
        .filter(el => ['Agent', 'Listener'].indexOf(el.name) < 0)
        .filter(el => el.Required === false)
        .map(el => ({ ...el, type: this.fieldType(el) }));
    },
    /**
     * The rules for the form, currently this is only to check for empty required fields.
     */
    rules() {
      return this.fields.reduce((map, field) => {
        // eslint-disable-next-line no-param-reassign
        map[field.name] = [];
        if (field.Required === true) {
          map[field.name].push(
            v => (!!v || v === 0) || `${field.name} is required`,
          );
        }

        return map;
      }, {});
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
    /**
     * When the fields change, we update the form map and set it for reaactivity to take place.
     */
    fields: {
      immediate: true,
      handler(arr = []) {
        const map2 = arr.reduce((map, obj) => {
          // eslint-disable-next-line no-param-reassign
          map[obj.name] = obj.Value;
          return map;
        }, {});

        Vue.set(this, 'form', map2);
      },
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
    this.$store.dispatch('listener/getListeners');
  },
  methods: {
    async handleSelect(item) {
      if (item === '' || item == null) {
        this.selectedItem = {};
        return;
      }
      const results = await this.$store.getters['module/searchModuleNames'](item);
      // eslint-disable-next-line prefer-destructuring
      this.selectedItem = results[0] || {};
    },
    rowClass(item) {
      if (item.status === 'rejected') return 'red';
      return '';
    },
    fieldExists(name) {
      return this.fields.filter(el => el.name === name).length > 0;
    },
    fieldType(el) {
      if (typeof el.Value === 'number') {
        if (el.Value.toString().indexOf('.') === -1) {
          return 'number';
        }
        return 'float';
      }
      if (typeof el.Value === 'boolean') {
        return 'boolean';
      }

      return 'string';
    },
    emitModuleChange(newVal) {
      this.$emit('modified', newVal);
    },
    async submit() {
      if (this.agents.length < 1 || this.loading || !this.$refs.form.validate()) {
        return;
      }

      this.loading = true;

      const result = await Promise.allSettled(this.agents
        .map(agent => moduleApi.executeModule(this.selectedModule,
          { ...this.form, Agent: agent })));

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
    },
  },
};
</script>

<style lang="scss" scoped>
.red {
  background-color: #bd4c4c;
}
</style>
