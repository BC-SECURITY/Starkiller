<template>
  <div class="agent-execute-module">
    <h4>Execute Module</h4>
    <info-viewer
      class="info-viewer"
      :info-array="moduleInfoArray"
    />
    <el-form
      ref="form"
      :model="form"
      :label-position="labelPosition"
      label-width="125px"
      class="form"
    >
      <el-form-item
        label="Module"
      >
        <el-select
          v-model="selectedModule"
          filterable
          placeholder="Please enter a module name"
          class="inline-input module-select"
          @change="handleSelect"
        >
          <el-option
            v-for="item in selectOptions"
            :key="item.Name"
            :label="item.Name"
            :value="item.Name"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="fieldExists('Agent')"
        prop="Agent"
        label="Agent"
      >
        <el-input
          v-model="form.Agent"
          disabled
        />
      </el-form-item>
      <el-form-item
        v-for="lis in requiredFields"
        :key="lis.name"
        :prop="lis.name"
        :label="lis.name"
      >
        <el-input
          v-model="form[lis.name]"
          :type="lis.type === 'string' ? 'text' : 'number'"
          :step="lis.type === 'float' ? '0.01' : ''"
        />
      </el-form-item>
      <el-collapse v-if="optionalFields.length > 0">
        <el-collapse-item
          title="Optional"
          name="1"
        >
          <el-form-item
            v-for="lis in optionalFields"
            :key="lis.name"
            :label="lis.name"
          >
            <el-input
              v-model="form[lis.name]"
              :type="lis.type === 'string' ? 'text' : 'number'"
              :step="lis.type === 'float' ? '0.01' : ''"
            />
          </el-form-item>
        </el-collapse-item>
      </el-collapse>
      <el-form-item
        v-if="!view"
        size="large"
      >
        <div class="footer">
          <el-button @click="cancel">
            Cancel
          </el-button>
          <el-button
            type="primary"
            :loading="loading"
            @click="submit"
          >
            {{ loading ? 'Submitting ...' : 'Submit' }}
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
  <!-- <span>Side Note: When a module is selected, link to the module's page</span> -->
</template>

<script>
import Vue from 'vue';
import { mapState } from 'vuex';
import InfoViewer from '@/components/InfoViewer.vue';

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
      view: false,
      loading: false,
      selectLoading: false,
      labelPosition: 'left',
      selectedModule: '',
      selectedItem: {},
      form: {},
    };
  },
  computed: {
    ...mapState({
      selectOptions: state => state.module.modules,
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
    submit() {
      this.$store.dispatch('module/executeModule', { name: this.selectedModule, options: this.form });
    },
    cancel() {

    },
  },
};
</script>

<style lang="scss" scoped>
.agent-execute-module {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-viewer {
  width: 100%;
  max-width: 800px;
}

.form {
  max-width: 600px;
}

.module-select {
  width: 400px;
}
</style>
