<template>
  <div>
    <v-breadcrumbs :items="breads" />
    <h3>{{ id ? 'Edit' : 'New' }} Listener</h3>
    <v-card style="padding: 10px">
      <v-form
        ref="form"
        style="max-width: 500px"
      >
        <v-autocomplete
          v-model="listenerType"
          :items="listenerTypes"
          dense
          outlined
          label="Type"
        />
        <v-text-field
          v-if="fieldExists('Name')"
          v-model="form.Name"
          label="Name"
          outlined
          dense
          required
        />

        <v-text-field
          v-if="fieldExists('Host')"
          v-model="form.Host"
          label="Host"
          outlined
          dense
          required
        />


        <v-text-field
          v-if="fieldExists('Port')"
          v-model="form.Port"
          label="Port"
          outlined
          dense
          required
          type="number"
        />

        <v-text-field
          v-for="field in requiredFields"
          :key="field.name"
          v-model="form[field.name]"
          :label="field.name"
          :type="field.type === 'string' ? 'text' : 'number'"
          outlined
          dense
          required
        />

        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-header>Optional Fields</v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-text-field
                v-for="field in optionalFields"
                :key="field.name"
                v-model="form[field.name]"
                :label="field.name"
                :type="field.type === 'string' ? 'text' : 'number'"
                outlined
                dense
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-form>
    </v-card>
  </div>
</template>

<script>
import * as listenerApi from '@/api/listener-api';
import { mapState } from 'vuex';
import Vue from 'vue';

export default {
  name: 'ListenerEdit',
  data() {
    return {
      listener: { options: {} },
      listenerType: '',
      listenerOptions: {},
      form: {},
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
      if (!this.id) {
        return Object.keys(this.listenerOptions)
          .map(key => ({ name: key, ...this.listenerOptions[key] }));
      }

      return Object.keys(this.listener.options)
        .map(key => ({ name: key, ...this.listener.options[key] }));
    },
    id() {
      return this.$route.params.id;
    },
    breads() {
      return [
        {
          text: 'Listeners',
          disabled: false,
          to: '/listeners',
          exact: true,
        },
        {
          text: this.id ? `Edit ${this.id}` : 'New',
          disabled: true,
          to: '/listeners-edit',
        },
      ];
    },
  },
  watch: {
    /**
     * When the fields change, we update the form map and set it for reaactivity to take place.
     */
    fields: {
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
  },
  mounted() {
    this.$store.dispatch('listener/getListenerTypes');

    if (this.$route.name === 'listenerEdit') {
      listenerApi.getListener(this.$route.params.id)
        .then((data) => { this.listener = data; });
    }
  },
  methods: {
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

<style>

</style>
