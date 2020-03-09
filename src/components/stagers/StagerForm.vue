<template>
  <div class="stager-form">
    <info-viewer
      class="info-viewer"
      :info-array="stagerInfoArray"
    />
    <el-form
      ref="form"
      :model="form"
      :label-position="labelPosition"
      label-width="125px"
      class="form"
      :rules="rules"
      :disabled="view"
    >
      <el-form-item label="Stager Type">
        <el-select
          v-model="stagerType"
          filterable
        >
          <el-option
            v-for="(item, index) in stagerTypes"
            :key="index"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="fieldExists('Listener')"
        prop="Listener"
        label="Listener"
      >
        <el-select
          v-model="form.Listener"
          filterable
        >
          <el-option
            v-for="(item, index) in listeners"
            :key="index"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-for="lis in requiredFields"
        :key="lis.name"
        :prop="lis.name"
        :label="lis.name"
      >
        <!-- TODO Figure out booleans in empire api-->
        <el-radio-group v-if="lis.type === 'boolean'">
          <el-radio>true</el-radio>
          <el-radio>false</el-radio>
        </el-radio-group>
        <el-input
          v-else
          v-model="form[lis.name]"
          :type="lis.type === 'string' ? 'text' : 'number'"
          :step="lis.type === 'float' ? '0.01' : ''"
        />
      </el-form-item>
      <el-collapse>
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
        v-if="!view && stagerType !== ''"
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
</template>

<script>
import Vue from 'vue';
import { mapGetters } from 'vuex';
import InfoViewer from '@/components/InfoViewer.vue';
import * as stagerApi from '@/api/stager-api';

export default {
  components: {
    InfoViewer,
  },
  props: {
    /**
     * Indicates whether we are creating or viewing a listener.
     */
    view: {
      type: Boolean,
      default: false,
    },
    /**
     * If we are viewing a listener, this is the object to populate the fields with.
     */
    viewObject: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      stagerType: '',
      labelPosition: 'left',
      loading: false,
      form: {},
      stagerOptions: [],
      stagerInfoArray: [],
    };
  },
  computed: {
    ...mapGetters({
      stagerTypes: 'stager/stagerTypes',
      listeners: 'listener/listenerNames',
    }),
    /**
     * Fields that go in the "Optional" drawer
     */
    optionalFields() {
      return this.fields
        .filter(el => ['Listener'].indexOf(el.name) < 0)
        .filter(el => el.Required === false)
        .map(el => ({ ...el, type: this.fieldType(el) }));
    },
    /**
     * All the fields that are marked required by the API, minus the fields that are
     * hardcoded to the top.
     */
    requiredFields() {
      return this.fields
        .filter(el => ['Listener'].indexOf(el.name) < 0)
        .filter(el => el.Required === true)
        .map(el => ({ ...el, type: this.fieldType(el) }));
    },
    /**
     * The fields from the API to dynamically generate the form.
     * If view is true, the fields are generated from the viewObject, otherwise it comes from
     * stagerOptions.
     */
    fields() {
      if (!this.view) {
        return Object.keys(this.stagerOptions)
          .map(key => ({ name: key, ...this.stagerOptions[key] }));
      }

      return Object.keys(this.viewObject)
        .map(key => ({ name: key, ...this.viewObject[key] }));
    },
    /**
     * The rules for the form, currently this is only to check for empty required fields.
     */
    rules() {
      return this.fields.reduce((map, field) => {
        // eslint-disable-next-line no-param-reassign
        map[field.name] = [];
        if (field.Required === true) {
          map[field.name].push({
            required: field.Required,
            message: `${field.name} is required`,
            trigger: 'blur',
          });
        }

        return map;
      }, {});
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
        Vue.set(this, 'form', map2);
      },
    },
    /**
     * When the type dropdown changes, we get the options for the new type.
     */
    stagerType: {
      async handler(val) {
        const a = await stagerApi.getStagerByName(val)
          .catch(err => this.$notify.error({
            title: 'Error',
            message: err,
          }));
        this.stagerOptions = a.options;
        this.stagerInfoArray = [
          { key: 'Author', value: a.Author.join(', ') },
          { key: 'Comments', value: a.Comments.join('\n') },
          { key: 'Description', value: a.Description },
        ];
      },
    },
    view: {
      immediate: true,
      handler(val) {
        if (val === true) {
          this.stagerType = this.viewObject.name;
        }
      },
    },
  },
  mounted() {
    this.$store.dispatch('stager/getStagers');
    this.$store.dispatch('listener/getListeners');
  },
  methods: {
    cancel() {
      this.loading = false;
      this.$emit('done');
    },
    async submit() {
      if (this.loading) {
        return;
      }

      try {
        await this.$refs.form.validate();
        await this.$confirm('Do you want to submit?');
      } catch (err) {
        return;
      }

      try {
        this.loading = true;
        await this.create();
        this.loading = false;
        this.$emit('done');
      } catch (err) {
        this.$emit('done');
      }
    },
    async create() {
      this.$store.dispatch('stager/generateStager', { ...this.form, StagerName: this.stagerType });
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
  },
};
</script>

<style lang="scss" scoped>
.stager-form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form {
  max-width: 600px;
  width: 100%;
}

.footer {
  padding-top: 20px;
}

.info-viewer {
  width: 100%;
  max-width: 800px;
}
</style>
