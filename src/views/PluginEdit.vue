<template>
  <div class="p4">
    <portal to="app-bar-extension">
      <div style="display: flex; flex-direction: row; width: 100%">
        <v-tabs v-model="tab" align-with-title>
          <v-tab key="details" href="#details">
            Details
            <v-icon x-small class="ml-1"> fa-info-circle </v-icon>
          </v-tab>
          <!-- TODO: disable when execution is disabled and when plugin isn't loaded -->
          <v-tab key="interact" href="#interact">
            Interact
            <v-icon x-small class="ml-1"> fa-terminal </v-icon>
          </v-tab>
          <v-tab key="tasks" href="#tasks">
            Tasks
            <v-icon x-small class="ml-1"> fa-sticky-note </v-icon>
          </v-tab>
          <v-tab key="settings" href="#settings">
            Settings
            <v-icon x-small class="ml-1"> fa-cog </v-icon>
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
      <template #extra-stuff>
        <tooltip-button-toggle
          v-model="isRefreshTasks"
          icon="fa-redo"
          :button-text="isRefreshTasks ? 'On' : 'Off'"
          text="Auto-refresh Tasks"
        />
        <v-switch
          v-model="plugin.enabled"
          :disabled="!plugin.loaded"
          color="green"
          label="Enabled"
          class="mr-2 mt-3"
          @change="toggleEnabled"
        ></v-switch>
      </template>
    </edit-page-top>
    <error-state-alert
      v-if="errorState"
      :resource-id="id"
      resource-type="plugin"
    />
    <v-tabs-items v-else v-model="tab" class="scrollable-pane">
      <v-tab-item
        v-if="initialLoad"
        key="details"
        :value="'details'"
        :transition="false"
        :reverse-transition="false"
      >
        <v-card flat>
          <v-card-title>Details</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <span v-if="!plugin.loaded">
                  <v-alert prominent type="warning">
                    <v-row align="center">
                      <v-col class="grow">
                        Plugin wasn't loaded. Check the server logs.

                        <span v-if="plugin.python_deps">
                          <vue-markdown :source="pluginPythonDeps" />
                        </span>
                      </v-col>
                    </v-row>
                  </v-alert>
                </span>
                <v-spacer />
                Authors:
                <author-chips :authors="plugin.authors" />
                <v-spacer />
                <v-card
                  v-if="plugin.readme"
                  class="pa-4"
                  outlined
                  elevation="2"
                >
                  <vue-markdown :source="plugin.readme" />
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item
        key="interact"
        :value="'interact'"
        :transition="false"
        :reverse-transition="false"
      >
        <h4 class="pl-4 pb-4">Execute Plugin</h4>
        <v-card style="padding: 10px">
          <technique-chips :techniques="plugin.TechniqueChips" />
          <general-form
            v-if="reset"
            ref="generalform"
            v-model="form"
            :options="pluginOptions"
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
      <v-tab-item
        key="settings"
        :value="'settings'"
        :transition="false"
        :reverse-transition="false"
      >
        <v-card flat>
          <v-card-title>Settings</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <span v-if="Object.keys(plugin.settings_options || {}) == 0"
                  >No settings available</span
                >
                <template v-else>
                  <general-form
                    v-if="reset"
                    ref="generalform"
                    v-model="settingsForm"
                    :options="plugin.settings_options"
                  />
                  <v-btn :loading="loading" color="primary" @click="submit">
                    Submit
                  </v-btn>
                </template>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script>
import GeneralForm from "@/components/GeneralForm.vue";
import * as pluginApi from "@/api/plugin-api";
import TechniqueChips from "@/components/TechniqueChips.vue";
import EditPageTop from "@/components/EditPageTop.vue";
import PluginTasksList from "@/components/plugins/PluginTasksList.vue";
import TooltipButtonToggle from "@/components/TooltipButtonToggle.vue";
import ErrorStateAlert from "@/components/ErrorStateAlert.vue";
import VueMarkdown from "vue-markdown-render";
import AuthorChips from "@/components/AuthorChips.vue";

export default {
  name: "PluginEdit",
  components: {
    AuthorChips,
    GeneralForm,
    TechniqueChips,
    EditPageTop,
    PluginTasksList,
    TooltipButtonToggle,
    ErrorStateAlert,
    VueMarkdown,
  },
  data() {
    return {
      reset: true,
      loading: false,
      isRefreshTasks: false,
      initialLoad: false,
      form: {},
      settingsForm: {},
      plugin: { execution_options: {} },
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
      const { execution_options } = this.plugin;
      if (!execution_options) return {};

      return execution_options;
    },
    id() {
      return this.$route.params.id;
    },
    tab: {
      set(tab) {
        this.$router.replace({ query: { ...this.$route.query, tab } });
      },
      get() {
        return this.$route.query.tab || "details";
      },
    },
    pluginPythonDeps() {
      let md = `Python Dependencies:\n\n`;
      this.plugin.python_deps.forEach((dep) => {
        md += `\`${dep}\`\n`;
      });
      return md;
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
    async toggleEnabled(val) {
      this.plugin.enabled = val;

      try {
        const response = await pluginApi.updatePlugin({
          ...this.plugin,
          options: this.form,
        });
        this.plugin = response;
      } catch (err) {
        this.plugin.enabled = !val;
        this.$snack.error(`Error: ${err}`);
      }
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
        })
        .finally(() => {
          this.initialLoad = true;
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
