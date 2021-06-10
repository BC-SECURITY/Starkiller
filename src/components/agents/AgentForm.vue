<template>
  <div style="padding: 10px">
    <v-form
      ref="form"
      v-model="valid"
      style="max-width: 500px"
    >
      <v-text-field
        v-for="field in requiredFields"
        :key="field.name"
        v-model="form[field.name]"
        :rules="rules[field.name]"
        :label="field.name"
        outlined
        dense
        required
        readonly
      />
    </v-form>
  </div>
</template>

<script>
import Vue from 'vue';

export default {
  props: {
    /**
     * The agent object to populate the form fields.
     */
    agent: {
      type: Object,
      required: true,
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
    };
  },
  computed: {
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
          // eslint-disable-next-line no-param-reassign
          map[obj.name] = obj.Value;
          return map;
        }, {});

        Vue.set(this, 'form', map2);
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
    fieldExists(name) {
      return this.fields.filter((el) => el.name === name).length > 0;
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
