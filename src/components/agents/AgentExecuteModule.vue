<template>
  <div style="padding: 10px">
    <h4 style="margin-bottom: 10px;">
      Execute Module
    </h4>
    <info-viewer
      class="info-viewer"
      :info-array="moduleInfoArray"
    />
    <v-form
      ref="form"
      @submit.prevent.native="submit"
    >
      <v-autocomplete
        v-model="selectedModule"
        :items="selectOptions"
        placeholder="Please enter a module name"
        outlined
        dense
        clearable
        @change="handleSelect"
      />
      <v-text-field
        v-if="fieldExists('Agent')"
        v-model="form.Agent"
        :rules="rules['Agent']"
        label="Agent"
        outlined
        dense
        disabled
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
          :loading="loading"
        >
          Submit
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script>
import Vue from 'vue';
import { mapState } from 'vuex';
import InfoViewer from '@/components/InfoViewer.vue';
import * as moduleApi from '@/api/module-api';

export default {
  components: {
    InfoViewer,
  },
  props: {
    agentName: {
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
    };
  },
  computed: {
    ...mapState({
      selectOptions: state => state.module.modules.map(el => el.Name),
    }),
    fields() {
      if (Object.keys(this.selectedItem).length < 1) {
        return [];
      }

      return Object.keys(this.selectedItem.options)
        .filter(el => ['Agent'].indexOf(el.name) < 0)
        .map(key => ({ name: key, ...this.selectedItem.options[key] }));
    },
    requiredFields() {
      return this.fields
        .filter(el => ['Agent'].indexOf(el.name) < 0)
        .filter(el => el.Required === true)
        .map(el => ({ ...el, type: this.fieldType(el) }));
    },
    optionalFields() {
      return this.fields
        .filter(el => ['Agent'].indexOf(el.name) < 0)
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
      handler(arr) {
        const map2 = arr.reduce((map, obj) => {
          // eslint-disable-next-line no-param-reassign
          map[obj.name] = obj.Value;
          return map;
        }, {});

        if (map2.Agent != null) {
          map2.Agent = this.agentName;
        }
        Vue.set(this, 'form', map2);
      },
    },
  },
  async mounted() {
    this.$store.dispatch('module/getModules');
  },
  methods: {
    async handleSelect(item) {
      if (item === '') {
        this.selectedItem = {};
      }
      const results = await this.$store.getters['module/searchModuleNames'](item);
      // eslint-disable-next-line prefer-destructuring
      this.selectedItem = results[0];
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
    async submit() {
      if (this.loading || !this.$refs.form.validate()) {
        return;
      }

      this.loading = true;
      try {
        await moduleApi.executeModule(this.selectedModule, this.form);
        this.$toast.success(`Module execution queued for ${this.agentName}`);
        this.selectedItem = {};
        this.selectedModule = '';
      } catch (err) {
        this.$toast.error(`Error: ${err}`);
      }

      this.loading = false;
    },
  },
};
</script>

<style lang="scss" scoped>
</style>
