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
import GeneralForm from '@/components/GeneralForm.vue';
import InfoViewer from '@/components/InfoViewer.vue';
import * as pluginApi from '@/api/plugin-api';
import TechniqueChips from '@/components/TechniqueChips.vue';
import EditPageTop from '@/components/EditPageTop.vue';

export default {
  name: 'PluginEdit',
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
      plugin: {},
    };
  },
  computed: {
    breads() {
      return [
        {
          text: 'Plugins',
          disabled: false,
          to: '/plugins',
          exact: true,
        },
        {
          text: this.breadcrumbName,
          disabled: true,
          to: '/plugins/edit',
        },
      ];
    },
    breadcrumbName() {
      if (this.plugin.name) return this.plugin.name;
      if (this.id) return this.id;
      return '';
    },
    pluginInfo() {
      if (Object.keys(this.plugin).length < 1) return {};
      return {
        authors: this.plugin.authors,
        description: this.plugin.description,
        comments: this.plugin.comments,
      };
    },
    pluginOptions() {
      const { options } = this.plugin;
      if (!options) return {};

      return options;
    },
    id() {
      return this.$route.params.id;
    },
  },
  mounted() {
    this.getPlugin(this.id);
  },
  methods: {
    async submit() {
      if (this.loading || !this.$refs.generalform.$refs.form.validate()) {
        return;
      }

      this.loading = true;

      try {
        const response = await pluginApi.executePlugin(this.plugin.name, this.form);
        this.$snack.success(`${response.detail}`);
      } catch (err) {
        this.$snack.error(`Error: ${err}`);
      }

      this.loading = false;
    },
    getPlugin(id) {
      pluginApi.getPlugin(id)
        .then((data) => {
          this.reset = false;

          this.plugin = data;
          setTimeout(() => { this.reset = true; }, 500);
        })
        .catch(() => {
          this.errorState = true;
        });
    },
  },
};
</script>

<style>
</style>
