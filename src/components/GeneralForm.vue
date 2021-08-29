<template>
  <v-form
    ref="form"
    v-model="valid"
    :readonly="readonly"
    @submit.prevent.native="submit"
  >
    <v-row
      v-for="field in requiredFields"
      :key="field.name"
    >
      <v-col cols="6">
        <dynamic-form-input
          v-model="form[field.name]"
          :suggested-values="suggestedValuesForField(field)"
          :strict="strictForField(field)"
          :name="field.name"
          :rules="rules[field.name]"
          :type="field.type"
        />
      </v-col>
      <v-col cols="6">
        <v-subheader> {{ field.Description }} </v-subheader>
      </v-col>
    </v-row>

    <v-subheader v-if="optionalFields.length > 0">
      Optional Fields
    </v-subheader>
    <v-divider
      v-if="optionalFields.length > 0"
      class="mb-8"
    />
    <v-row
      v-for="field in optionalFields"
      :key="field.name"
    >
      <v-col cols="6">
        <dynamic-form-input
          v-model="form[field.name]"
          :suggested-values="suggestedValuesForField(field)"
          :strict="strictForField(field)"
          :name="field.name"
          :rules="rules[field.name]"
          :type="field.type"
        />
      </v-col>
      <v-col cols="6">
        <v-subheader> {{ field.Description }} </v-subheader>
      </v-col>
    </v-row>
  </v-form>
</template>

<script>
import Vue from 'vue';
import { mapGetters } from 'vuex';
import DynamicFormInput from './DynamicFormInput.vue';

export default {
  components: {
    DynamicFormInput,
  },
  props: {
    options: {
      type: Object,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      form: {},
      valid: true,
    };
  },
  computed: {
    ...mapGetters({
      listeners: 'listener/listenerNames',
      bypasses: 'bypass/bypassNames',
      malleableProfiles: 'malleable/profileNames',
      credentials: 'credential/credentials',
    }),
    /**
     * Fields that go in the "Optional" section
     */
    optionalFields() {
      return this.fields
        .filter((el) => el.Required === false)
        .map((el) => ({ ...el, type: this.fieldType(el) }));
    },
    /**
     * All the fields that are marked required by the API
     */
    requiredFields() {
      return this.fields
        .filter((el) => el.Required === true)
        .map((el) => ({ ...el, type: this.fieldType(el) }));
    },
    /**
     * The fields from the API to dynamically generate the form.
     * If items are in the `priority` list, they will be moved to the top of
     * their respective sections.
     */
    fields() {
      const fields = Object.keys(this.options)
        .map((key) => ({ name: key, ...this.options[key] }));

      this.priority.slice().reverse().forEach((item) => {
        const index = fields.findIndex((f) => f.name === item);
        if (index > -1) {
          const fItem = fields.splice(index, 1)[0];
          fields.unshift(fItem);
        }
      });

      return fields;
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
            (v) => (!!v || v === 0) || `${field.name} is required`,
          );
        }

        return map;
      }, {});
    },
  },
  watch: {
    form: {
      handler(val) {
        const form2 = { ...val };
        if (form2.Bypasses) {
          form2.Bypasses = form2.Bypasses.join(' ');
        }
        this.$emit('input', form2);
      },
      deep: true,
    },
    /**
     * When the fields change, we update the form map and set it for reactivity to take place.
     */
    fields: {
      immediate: true,
      handler(arr) {
        const map2 = arr.reduce((map, obj) => {
          if (obj.name === 'Bypasses' && !Array.isArray(obj.Value)) {
            // eslint-disable-next-line no-param-reassign
            map[obj.name] = obj.Value.split(' ') || [];
          } else {
            // eslint-disable-next-line no-param-reassign
            map[obj.name] = obj.Value == null ? '' : obj.Value;
          }
          return map;
        }, {});
        Vue.set(this, 'form', map2);
      },
    },
  },
  mounted() {
    this.$store.dispatch('listener/getListeners');
    this.$store.dispatch('bypass/getBypasses');
    this.$store.dispatch('malleable/getMalleableProfiles');
    this.$store.dispatch('credential/getCredentials');
  },
  methods: {
    suggestedValuesForField(field) {
      if (field.name === 'Listener') {
        return this.listeners;
      } if (field.name === 'Bypasses') {
        return this.bypasses;
      } if (field.name === 'Profile') {
        return this.malleableProfiles;
      } if (field.name === 'CredID') {
        return this.credentials;
      }
      return field.SuggestedValues;
    },
    strictForField(field) {
      if (field.name === 'Listener') {
        return true;
      } if (field.name === 'Bypasses') {
        return true;
      } if (field.name === 'Profile') {
        return true;
      } if (field.name === 'CredID') {
        return true;
      }
      return field.Strict;
    },
    fieldExists(name) {
      return this.fields.find((el) => el.name === name);
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

<style>

</style>
