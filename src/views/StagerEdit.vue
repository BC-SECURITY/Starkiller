<template>
  <div>
    <v-breadcrumbs :items="breads" />
    <h3>{{ id ? 'Edit' : 'New' }} Stager</h3>
    <v-card style="padding: 10px">
      <info-viewer
        class="info-viewer"
        :info-array="stagerInfoArray"
      />
      <v-form
        ref="form"
        v-model="valid"
        style="max-width: 500px"
        @submit.prevent.native="submit"
      >
        <v-autocomplete
          v-model="stagerType"
          :items="stagerTypes"
          dense
          outlined
          label="Type"
        />

        <v-autocomplete
          v-if="fieldExists('Listener')"
          v-model="form.Listener"
          :rules="rules['Listener']"
          :items="listeners"
          dense
          outlined
          label="Listener"
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
                :rules="rules[field.name]"
                :label="field.name"
                :type="field.type === 'string' ? 'text' : 'number'"
                outlined
                dense
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-btn
          type="submit"
          class="mt-4 primary"
          :loading="loading"
        >
          submit
        </v-btn>
      </v-form>
    </v-card>
  </div>
</template>

<script>
import * as stagerApi from '@/api/stager-api';
import { mapGetters } from 'vuex';
import Vue from 'vue';
import InfoViewer from '@/components/InfoViewer.vue';

export default {
  name: 'StagerEdit',
  components: {
    InfoViewer,
  },
  data() {
    return {
      stager: { options: {} },
      stagerType: '',
      stagerOptions: {},
      form: {},
      valid: true,
      loading: false,
      stagerInfoArray: [],
    };
  },
  computed: {
    ...mapGetters({
      stagerTypes: 'stager/stagerTypes',
      listeners: 'listener/listenerNames',
    }),
    isNew() {
      return this.$route.name === 'stagerNew';
    },
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
     * listenerOptions.
     */
    fields() {
      if (this.isNew) {
        return Object.keys(this.stagerOptions)
          .map(key => ({ name: key, ...this.stagerOptions[key] }));
      }

      return Object.keys(this.stager.options)
        .map(key => ({ name: key, ...this.stager.options[key] }));
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
            v => (!!v && v !== 0) || `${field.name} is required`,
          );
        }

        return map;
      }, {});
    },
    id() {
      return this.$route.params.id;
    },
    breads() {
      return [
        {
          text: 'Stagers',
          disabled: false,
          to: '/stagers',
          exact: true,
        },
        {
          text: this.id ? `Edit ${this.id}` : 'New',
          disabled: true,
          to: '/stagers-edit',
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
    stagerType: {
      async handler(val) {
        const a = await stagerApi.getStagerByName(val)
          .catch(err => this.$toast.error(`Error: ${err}`));
        if (a) {
          this.stagerOptions = a.options;
          this.stagerInfoArray = [
            { key: 'Author', value: a.Author.join(', ') },
            { key: 'Comments', value: a.Comments.join('\n') },
            { key: 'Description', value: a.Description },
          ];
        }
      },
    },
    id(val) {
      if (val) {
        this.getListener(val);
      }
    },
  },
  mounted() {
    this.$store.dispatch('stager/getStagers');
    this.$store.dispatch('listener/getListeners');
  },
  methods: {
    async submit() {
      if (this.loading || !this.$refs.form.validate()) {
        return;
      }

      this.loading = true;
      await this.create();
    },
    create() {
      return stagerApi.generateStager({ StagerName: this.stagerType, ...this.form })
        .then((stager) => {
          this.$store.dispatch('stager/addStager', stager);
          // electron-store is slower and needs some time to save
          // before we go back to the list view.
          setTimeout(() => {
            this.$router.push({ name: 'stagers' });
            this.loading = false;
          }, 2500);
        })
        .catch((err) => {
          this.$toast.error(`Error: ${err}`);
          this.loading = false;
        });
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

<style>

</style>
