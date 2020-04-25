<template>
  <div>
    <v-breadcrumbs :items="breads" />
    <div class="headers">
      <h3>{{ mode }} Listener</h3>
      <!-- <v-btn
        color="purple darken-3"
        fab
        small
        @click="editMode = !editMode"
      >
        <v-icon v-if="editMode">
          mdi-close
        </v-icon>
        <v-icon v-else>
          mdi-pencil
        </v-icon>
      </v-btn> -->
    </div>
    <v-card style="padding: 10px">
      <v-form
        ref="form"
        v-model="valid"
        style="max-width: 500px"
      >
        <v-autocomplete
          v-model="listenerType"
          :items="listenerTypes"
          dense
          outlined
          label="Type"
          :readonly="!editMode"
        />
        <v-text-field
          v-if="fieldExists('Name')"
          v-model="form.Name"
          :rules="rules['Name']"
          label="Name"
          outlined
          dense
          required
          :readonly="!editMode"
        />
        <v-text-field
          v-if="fieldExists('Host')"
          v-model="form.Host"
          :rules="rules['Host']"
          label="Host"
          outlined
          dense
          required
          :readonly="!editMode"
        />
        <v-text-field
          v-if="fieldExists('Port')"
          v-model="form.Port"
          :rules="rules['Port']"
          label="Port"
          outlined
          dense
          required
          type="number"
          :readonly="!editMode"
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
          :readonly="!editMode"
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
                :readonly="!editMode"
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-btn
          v-if="isNew"
          class="mt-4 primary"
          :loading="loading"
          @click="submit"
        >
          submit
        </v-btn>
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
      valid: true,
      loading: false,
      // Listeners are not editable, but I figured I would do a proof of concept for if we ever can edit
      // things. I'd also imagine that when we do an update, it will only be certain fields, so when we go
      // to edit mode, we could also remove all the immutable fields.
      editMode: true,
    };
  },
  computed: {
    ...mapState({
      listenerTypes: state => state.listener.types,
    }),
    isNew() {
      return this.$route.name === 'listenerNew';
    },
    mode() {
      if (this.isNew) return 'New';
      if (this.editMode) return 'Edit';
      return 'View';
    },
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
      if (this.isNew) {
        return Object.keys(this.listenerOptions)
          .map(key => ({ name: key, ...this.listenerOptions[key] }));
      }

      return Object.keys(this.listener.options)
        .map(key => ({ name: key, ...this.listener.options[key] }));
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
            v => !!v || `${field.name} is required`,
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
    id(val) {
      if (val) {
        this.getListener(val);
      }
    },
  },
  mounted() {
    this.$store.dispatch('listener/getListenerTypes');

    if (!this.isNew) {
      this.getListener(this.id);
    }
  },
  methods: {
    async submit() {
      if (this.loading || !this.$refs.form.validate()) {
        return;
      }

      try {
        await this.$confirm('Do you want to create this listener?');
      } catch (err) {
        return;
      }

      this.loading = true;
      await this.create();
      this.loading = false;
    },
    create() {
      return listenerApi.createListener(this.listenerType, this.form)
        .then(() => this.$router.push({ name: 'listenerEdit', params: { id: this.form.Name } }))
        .catch(err => this.$notify.error({
          title: 'Error Creating Listener',
          message: err,
        }));
    },
    getListener(id) {
      listenerApi.getListener(id)
        .then((data) => {
          this.listener = data;
          this.listenerType = data.module;
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
