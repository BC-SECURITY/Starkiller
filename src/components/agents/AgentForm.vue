<template>
  <div class="agent-form">
    <el-form
      ref="nameForm"
      :model="nameForm"
      :rules="nameRules"
      :inline="inline"
      label-width="125px"
      class="form"
      @submit.prevent.native="submitRename"
    >
      <el-form-item
        v-if="fieldExists('name')"
        :label-position="labelPosition"
        prop="name"
        label="Name"
      >
        <el-input
          v-model="nameForm.name"
          style="width: 250px"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          native-type="submit"
          type="primary"
          size="mini"
          :loading="nameLoading"
        >
          {{ loading ? 'Submitting ...' : 'Rename' }}
        </el-button>
      </el-form-item>
    </el-form>
    <el-form
      ref="form"
      :model="form"
      :label-position="labelPosition"
      label-width="125px"
      class="form"
      :disabled="view"
    >
      <el-form-item
        v-for="lis in requiredFields"
        :key="lis.name"
        :prop="lis.name"
        :label="lis.name"
      >
        <el-input
          v-model="form[lis.name]"
        />
      </el-form-item>
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

export default {
  props: {
    /**
     * Indicates whether we are creating or viewing an agent.
     */
    view: {
      type: Boolean,
      default: false,
    },
    /**
     * If we are viewing an agent, this is the object to populate the fields with.
     */
    viewObject: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      nameLoading: false,
      loading: false,
      labelPosition: 'left',
      nameForm: {},
      nameRules: {
        name: [
          { required: true, message: 'Please input name', trigger: 'blur' },
          { min: 3, message: 'Length should be at least 3', trigger: 'blur' },
        ],
      },
      form: {},
      inline: true,
    };
  },
  computed: {
    fields() {
      // stale comes back as a boolean, while no other property does and el-input
      // doesn't accept booleans so this will do.
      return Object.keys(this.viewObject)
        .map(key => ({
          name: key,
          Value: typeof this.viewObject[key] === 'boolean' ? `${this.viewObject[key]}` : this.viewObject[key],
        }));
    },
    /**
     * Following the same structure as the other forms, but in this case there are no
     * "requiredFields". It's just everything minus the name since we want that at the top.
     */
    requiredFields() {
      return this.fields
        .filter(el => ['name'].indexOf(el.name) < 0);
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
        Vue.set(this, 'nameForm', { name: map2.name });
      },
    },
  },
  methods: {
    cancel() {
      // no-op
    },
    submit() {
      // no-op
      // We may want to come back in the future to add the ability to edit working hours, etc.
    },
    async submitRename() {
      if (this.nameLoading) { return; }

      try {
        await this.$refs.nameForm.validate();
        await this.$confirm('Are you sure you want to rename this agent?');
      } catch (err) {
        return;
      }

      this.nameLoading = true;
      await this.$store.dispatch('agent/rename', { oldName: this.viewObject.name, newName: this.nameForm.name })
        .catch(() => { this.nameLoading = false; });
      this.nameLoading = false;
    },
    fieldExists(name) {
      return this.fields.filter(el => el.name === name).length > 0;
    },
  },
};
</script>

<style lang="scss" scoped>
.agent-form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form {
  max-width: 600px;
  width: 100%;
}
</style>
