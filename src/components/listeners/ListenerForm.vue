<template>
  <div class="listener-form">
    <el-form
      ref="form"
      :model="form"
      :label-position="labelPosition"
      label-width="125px"
      class="form"
      style="max-width: 600px"
      :rules="rules"
      :disabled="view"
    >
      <el-form-item label="Listener Type">
        <el-select
          v-model="listenerType"
          filterable
        >
          <el-option
            v-for="(item, index) in listenerTypes"
            :key="index"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="fieldExists('Name')"
        prop="Name"
        label="Name"
      >
        <el-input v-model="form.Name" />
      </el-form-item>
      <el-form-item
        v-if="fieldExists('Host')"
        prop="Host"
        label="Host"
      >
        <el-input v-model="form.Host" />
      </el-form-item>
      <el-form-item
        v-if="fieldExists('Port')"
        prop="Port"
        label="Port"
      >
        <el-input
          v-model="form.Port"
          type="number"
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
</template>

<script>
import Vue from 'vue';
import { mapState } from 'vuex';
import * as listenerApi from '@/api/listener-api';

export default {
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
      listenerType: '',
      labelPosition: 'left',
      loading: false,
      form: {},
      listenerOptions: {},
    };
  },
  computed: {
    ...mapState({
      listenerTypes: state => state.listener.types,
    }),
    /**
     * Fields that go in the "Optional" drawer
     */
    optionalFields() {
      return this.fields
        .filter(el => ['Name', 'Port', 'Host'].indexOf(el.name) < 0)
        .filter(el => el.Required === false)
        .map(el => ({ ...el, type: this.fieldType(el) }));
    },
    /**
     * All the fields that are marked required by the API, minus the fields that are
     * hardcoded to the top.
     */
    requiredFields() {
      return this.fields
        .filter(el => ['Name', 'Port', 'Host'].indexOf(el.name) < 0)
        .filter(el => el.Required === true)
        .map(el => ({ ...el, type: this.fieldType(el) }));
    },
    /**
     * The fields from the API to dynamically generate the form.
     * If view is true, the fields are generated from the viewObject, otherwise it comes from
     * listenerOptions.
     */
    fields() {
      if (!this.view) {
        return Object.keys(this.listenerOptions)
          .map(key => ({ name: key, ...this.listenerOptions[key] }));
      }

      return Object.keys(this.viewObject.options)
        .map(key => ({ name: key, ...this.viewObject.options[key] }));
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
    listenerType: {
      async handler(val) {
        this.listenerOptions = await listenerApi.getListenerOptions(val)
          .catch(err => this.$notify.error({
            title: 'Error',
            message: err,
          }));
      },
    },
    view: {
      immediate: true,
      handler(val) {
        if (val === true) {
          this.listenerType = this.viewObject.module;
        }
      },
    },
  },
  mounted() {
    this.$store.dispatch('listener/getListenerTypes');
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
        try {
          await this.$refs.form.validate();
          await this.$confirm('Do you want to submit?');
        } catch (err) {
          return;
        }

        this.loading = true;
        await this.create();
        this.loading = false;
        this.$emit('done');
      } catch (err) {
        this.$emit('done');
      }
    },
    async create() {
      await this.$store.dispatch('listener/createListener', this.form);
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

      return 'string';
    },
  },
};
</script>

<style scoped>
.listener-form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form {
  max-width: 600px;
  width: 100%;
}

.content {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  padding-bottom: 20px;
}

.footer {
  padding-top: 20px;
}
</style>
