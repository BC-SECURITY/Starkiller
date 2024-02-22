<template>
  <div class="p4">
    <portal to="app-bar-extension">
      <div style="display: flex; flex-direction: row; width: 100%">
        <v-tabs v-model="tab" align-with-title>
          <v-tab key="interact" href="#interact">
            Interact
            <v-icon x-small class="ml-1"> fa-terminal </v-icon>
          </v-tab>
          <v-tab key="tasks" href="#tasks">
            Tasks
            <v-icon x-small class="ml-1"> fa-sticky-note </v-icon>
          </v-tab>
        </v-tabs>
      </div>
    </portal>
    <edit-page-top
      :breads="breads"
      :show-submit="false"
      :show-copy="false"
      :show-delete="false"
      :submit-loading="loading"
      @submit="submit"
    >
      <template slot="extra-stuff">
        <tooltip-button-toggle
          v-model="isRefreshTasks"
          icon="fa-redo"
          :button-text="isRefreshTasks ? 'On' : 'Off'"
          text="Auto-refresh Tasks"
        />
      </template>
    </edit-page-top>
    <error-state-alert
      v-if="errorState"
      :resource-id="id"
      resource-type="plugin"
    />
    <v-tabs-items v-else v-model="tab" class="scrollable-pane">
      <v-tab-item
        key="interact"
        :value="'interact'"
        :transition="false"
        :reverse-transition="false"
      >
        <h4 class="pl-4 pb-4">Execute Plugin</h4>
        <v-card style="padding: 10px">
          <info-viewer class="info-viewer" :info="pluginInfo" />
          <technique-chips :techniques="plugin.TechniqueChips" />
          <general-form
            v-if="reset"
            ref="generalform"
            v-model="form"
            :options="plugin.options"
          />
          <v-btn :loading="loading" color="primary" @click="submit">
            Submit
          </v-btn>
        </v-card>
      </v-tab-item>
      <v-tab-item
        key="tasks"
        :value="'tasks'"
        :transition="false"
        :reverse-transition="false"
      >
        <v-card flat>
          <plugin-tasks-list :plugin="plugin" :refresh-tasks="isRefreshTasks" />
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script>
import GeneralForm from "@/components/GeneralForm.vue";
import InfoViewer from "@/components/InfoViewer.vue";
import * as pluginApi from "@/api/plugin-api";
import TechniqueChips from "@/components/TechniqueChips.vue";
import EditPageTop from "@/components/EditPageTop.vue";
import PluginTasksList from "@/components/plugins/PluginTasksList.vue";
import TooltipButtonToggle from "@/components/TooltipButtonToggle.vue";
import ErrorStateAlert from "@/components/ErrorStateAlert.vue";

export default {
  name: "PluginEdit",
  components: {
    InfoViewer,
    GeneralForm,
    TechniqueChips,
    EditPageTop,
    PluginTasksList,
    TooltipButtonToggle,
    ErrorStateAlert,
  },
  data() {
    return {
      reset: true,
      loading: false,
      isRefreshTasks: false,
      form: {},
      plugin: { options: {} },
      errorState: false,
    };
  },
  computed: {
    breads() {
      return [
        {
          text: "Plugins",
          disabled: false,
          to: "/plugins",
          exact: true,
        },
        {
          text: this.breadcrumbName,
          disabled: true,
          to: "/plugins/edit",
        },
      ];
    },
    breadcrumbName() {
      if (this.plugin.name) return this.plugin.name;
      if (this.id) return this.id;
      return "";
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
    tab: {
      set(tab) {
        this.$router.replace({ query: { ...this.$route.query, tab } });
      },
      get() {
        return this.$route.query.tab || "interact";
      },
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
        const response = await pluginApi.executePlugin(
          this.plugin.name,
          this.form,
        );
        this.$snack.success(`${response.detail}`);
      } catch (err) {
        this.$snack.error(`Error: ${err}`);
      }

      this.loading = false;
    },
    getPlugin(id) {
      pluginApi
        .getPlugin(id)
        .then((data) => {
          this.reset = false;

          this.plugin = data;
          setTimeout(() => {
            this.reset = true;
          }, 500);
        })
        .catch(() => {
          this.errorState = true;
        });
    },
  },
};
</script>

<style lang="scss">
// Overrides vuetify.css
// Because we moved the tabs into a div, which made the color funky.
.v-toolbar__content > div > .v-tabs > .v-slide-group.v-tabs-bar,
.v-toolbar__extension > div > .v-tabs > .v-slide-group.v-tabs-bar {
  background-color: inherit;
}
</style>
