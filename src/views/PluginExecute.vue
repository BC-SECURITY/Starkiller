<template>
  <div class="p4">
    <v-breadcrumbs :items="breads" />
    <h4 class="pl-4 pb-4">
      Execute Plugin
    </h4>
    <v-card style="padding: 10px">
      <info-viewer
        class="info-viewer"
        :info-array="pluginInfoArray"
      />
      <v-form
        ref="form"
        @submit.prevent.native="submit"
      >
        <div
          v-if="plugin.Techniques"
          class="flex flex-row flex-wrap mb-2"
        >
          <span class="mr-2">Techniques:</span>
          <v-chip
            v-for="tech in plugin.Techniques.filter(t => t !== '')"
            :key="tech"
            small
            :href="`https://attack.mitre.org/techniques/${tech}`"
            target="_blank"
            color="green"
            class="mr-1 mb-1"
            @click.native="openExternalBrowser"
          >
            {{ tech }}
          </v-chip>
        </div>
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
            Execute
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Vue from 'vue';
import InfoViewer from '@/components/InfoViewer.vue';
import * as pluginApi from '@/api/plugin-api';

export default {
  name: 'PluginExecute',
  components: {
    InfoViewer,
  },
  data() {
    return {
      form: {},
      loading: false,
    };
  },
  computed: {
    ...mapState({
      plugins: state => state.plugin.plugins,
    }),
    breads() {
      return [
        {
          text: 'Plugins',
          disabled: false,
          to: '/plugins',
          exact: true,
        },
        {
          text: `${this.plugin.Name}`,
          disabled: true,
          to: '/plugins/execute',
        },
      ];
    },
    plugin() {
      return this.plugins.find(p => p.Name === this.$route.params.id) || {};
    },
    pluginInfoArray() {
      if (Object.keys(this.plugin).length < 1) return [];
      return [
        { key: 'Author', value: this.plugin.Author.join(', ') },
        { key: 'Comments', value: this.plugin.Comments.join('\n') },
        { key: 'Description', value: this.plugin.Description },
      ];
    },
    fields() {
      if (Object.keys(this.plugin).length < 1) {
        return [];
      }

      return Object.keys(this.plugin.options)
        .map(key => ({ name: key, ...this.plugin.options[key] }));
    },
    requiredFields() {
      return this.fields
        .filter(el => el.Required === true)
        .map(el => ({ ...el, type: this.fieldType(el) }));
    },
    optionalFields() {
      return this.fields
        .filter(el => el.Required === false)
        .map(el => ({ ...el, type: this.fieldType(el) }));
    },
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
  },
  watch: {
    /**
     * When the fields change, we update the form map and set it for reaactivity to take place.
     */
    fields: {
      immediate: true,
      handler(arr = []) {
        const map2 = arr.reduce((map, obj) => {
          // eslint-disable-next-line no-param-reassign
          map[obj.name] = obj.Value;
          return map;
        }, {});

        Vue.set(this, 'form', map2);
      },
    },
  },
  mounted() {
    if (this.plugins.length === 0) {
      this.$store.dispatch('plugin/getPlugins');
    }
  },
  methods: {
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

      // todo currently this endpoint just returns null on success.
      // next version of this api should have better messaging.
      try {
        await pluginApi.executePlugin(this.plugin.Name, this.form);
      } catch (err) {
        this.$toast.error(`Error: ${err}`);
      }

      this.loading = false;
    },
  },
};
</script>

<style>
</style>
