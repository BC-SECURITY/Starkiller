<template>
  <div class="p4">
    <edit-page-top
      :breads="breads"
      :show-submit="true"
      :show-copy="false"
      :show-delete="false"
      :submit-loading="loading"
      @submit="submit"
    />
    <h4 class="pl-4 pb-4">
      Execute Plugin
    </h4>
    <v-card style="padding: 10px">
      <info-viewer
        class="info-viewer"
        :info="pluginInfo"
      />
      <technique-chips :techniques="plugin.TechniqueChips" />
      <general-form
        v-if="reset"
        ref="generalform"
        v-model="form"
        :options="plugin.options"
      />
    </v-card>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import GeneralForm from '@/components/GeneralForm.vue';
import InfoViewer from '@/components/InfoViewer.vue';
import * as pluginApi from '@/api/plugin-api';
import TechniqueChips from '@/components/TechniqueChips.vue';
import EditPageTop from '@/components/EditPageTop.vue';

export default {
  name: 'PluginExecute',
  components: {
    InfoViewer,
    GeneralForm,
    TechniqueChips,
    EditPageTop,
  },
  data() {
    return {
      reset: true,
      loading: false,
      form: {},
    };
  },
  computed: {
    ...mapState({
      plugins: (state) => state.plugin.plugins,
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
          text: `${this.plugin.name}`,
          disabled: true,
          to: '/plugins/execute',
        },
      ];
    },
    // todo refactor this to work like other pages where we can call
    // the /api/plugin/:id/ endpoint instead of the list endpoint.
    plugin() {
      return this.plugins.find((p) => p.id === this.$route.params.id) || {};
    },
    pluginInfo() {
      if (Object.keys(this.plugin).length < 1) return {};
      return {
        authors: this.plugin.authors,
        description: this.plugin.description,
        comments: this.plugin.comments,
      };
    },
  },
  mounted() {
    if (this.plugins.length === 0) {
      this.$store.dispatch('plugin/getPlugins');
    }
  },
  methods: {
    async submit() {
      if (this.loading || !this.$refs.generalform.$refs.form.validate()) {
        return;
      }

      this.loading = true;

      // todo currently this endpoint just returns null on success.
      // next version of this api should have better messaging.
      try {
        await pluginApi.executePlugin(this.plugin.name, this.form);
      } catch (err) {
        this.$snack.error(`Error: ${err}`);
      }

      this.loading = false;
    },
  },
};
</script>

<style>
</style>
