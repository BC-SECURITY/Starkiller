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
      <general-form
        v-if="reset"
        :options="plugin.options"
        :loading="loading"
        @submit="submit"
      />
    </v-card>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import GeneralForm from '@/components/GeneralForm.vue';
import InfoViewer from '@/components/InfoViewer.vue';
import * as pluginApi from '@/api/plugin-api';

export default {
  name: 'PluginExecute',
  components: {
    InfoViewer,
    GeneralForm,
  },
  data() {
    return {
      reset: true,
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
  },
  mounted() {
    if (this.plugins.length === 0) {
      this.$store.dispatch('plugin/getPlugins');
    }
  },
  methods: {
    async submit(form) {
      if (this.loading) {
        return;
      }

      this.loading = true;

      // todo currently this endpoint just returns null on success.
      // next version of this api should have better messaging.
      try {
        await pluginApi.executePlugin(this.plugin.Name, form);
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
