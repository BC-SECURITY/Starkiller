<template>
  <div class="p4">
    <Teleport defer to="#app-bar-extension">
      <div style="display: flex; flex-direction: row; width: 100%">
        <v-tabs v-model="tab" color="primary" align-with-title>
          <v-tab key="interact" value="interact" :disabled="interactDisabled">
            Interact
            <v-icon size="x-small" class="ml-1"> fa-terminal </v-icon>
          </v-tab>
          <v-tab key="tasks" value="tasks" :disabled="!plugin.loaded">
            Tasks
            <v-icon size="x-small" class="ml-1"> fa-sticky-note </v-icon>
          </v-tab>
          <v-tab key="details" value="details">
            Details
            <v-icon size="x-small" class="ml-1"> fa-info-circle </v-icon>
          </v-tab>
          <v-tab key="settings" value="settings" :disabled="!plugin.loaded">
            Settings
            <v-icon size="x-small" class="ml-1"> fa-cog </v-icon>
          </v-tab>
        </v-tabs>
      </div>
    </Teleport>
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
          v-if="plugin.loaded"
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
          hide-details
          class="mr-2"
          @update:model-value="toggleEnabled"
        ></v-switch>
      </template>
    </edit-page-top>
    <error-state-alert
      v-if="errorState"
      :resource-id="id"
      resource-type="plugin"
    />
    <v-window v-else v-model="tab" class="scrollable-pane">
      <v-window-item
        key="interact"
        value="interact"
        :transition="false"
        :reverse-transition="false"
      >
        <h4 class="pl-4 pb-4">Execute Plugin</h4>
        <v-card style="padding: 10px">
          <technique-chips :techniques="plugin.TechniqueChips" />
          <general-form
            v-if="initialLoad"
            :key="plugin.id"
            ref="generalform"
            v-model="form"
            :options="pluginOptions"
          />
          <v-btn
            :disabled="!plugin.enabled"
            :loading="loading"
            color="primary"
            @click="submit"
          >
            Submit
          </v-btn>
        </v-card>
      </v-window-item>
      <v-window-item
        key="tasks"
        value="tasks"
        :transition="false"
        :reverse-transition="false"
      >
        <v-card flat>
          <plugin-tasks-list
            :plugin="plugin"
            :refresh-tasks="isRefreshTasks"
            :use-header="false"
          />
        </v-card>
      </v-window-item>
      <v-window-item
        v-if="initialLoad"
        key="details"
        value="details"
        :transition="false"
        :reverse-transition="false"
      >
        <v-card flat>
          <v-card-title>Details</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <span v-if="!plugin.loaded">
                  <v-alert prominent type="warning" variant="outlined">
                    <v-row align="center">
                      <v-col class="grow">
                        <vue-markdown
                          :source="pluginPythonDeps"
                          :options="{ html: true }"
                        />
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
                  variant="outlined"
                  elevation="2"
                >
                  <vue-markdown :source="plugin.readme" />
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>
      <v-window-item
        key="settings"
        value="settings"
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
                    v-if="initialLoad"
                    :key="`settings-${plugin.id}`"
                    ref="settingsform"
                    v-model="settingsForm"
                    :options="pluginSettingsOptions"
                  />
                  <v-btn
                    :loading="loading"
                    color="primary"
                    @click="submitSettings"
                  >
                    Submit
                  </v-btn>
                </template>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>
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
  inject: ["snack"],
  data() {
    return {
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
          title: "Plugins",
          disabled: false,
          to: "/plugins",
          exact: true,
        },
        {
          title: this.breadcrumbName,
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
    pluginOptions() {
      const { execution_options } = this.plugin;
      if (!execution_options) return {};

      return execution_options;
    },
    pluginSettingsOptions() {
      const options = {};
      Object.keys(this.plugin.settings_options).forEach((key) => {
        options[key] = { ...this.plugin.settings_options[key] };
        options[key].value = this.plugin.current_settings[key];
      });
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
        if (this.$route.query.tab) {
          return this.$route.query.tab;
        }
        if (this.interactDisabled) {
          return "details";
        }

        return "interact";
      },
    },
    interactDisabled() {
      return (
        !this.plugin ||
        !this.plugin.loaded ||
        !this.plugin.enabled ||
        !this.plugin.execution_enabled
      );
    },
    pluginPythonDeps() {
      if (!this.plugin.python_deps.length > 0) {
        return `
Plugin wasn't loaded. Check the server logs.
`;
      }

      return `
This plugin requires additional Python dependencies.
Please install and restart the server.
\`\`\`sh
poetry add ${this.plugin.python_deps.join(" ")}
\`\`\`
      `;
    },
  },
  mounted() {
    this.getPlugin(this.id);
  },
  methods: {
    async submit() {
      if (this.loading) return;
      const valid = await this.$refs.generalform.validate();
      if (!valid) return;

      this.loading = true;

      try {
        const response = await pluginApi.executePlugin(
          this.plugin.id,
          this.form,
        );
        this.snack.success(`${response.detail}`);
      } catch (err) {
        this.snack.error(`Error: ${err}`);
      }

      this.loading = false;
    },
    async submitSettings() {
      if (this.loading) return;
      const valid = await this.$refs.settingsform.validate();
      if (!valid) return;

      this.loading = true;

      try {
        await pluginApi.updatePluginSettings(this.plugin.id, this.settingsForm);
        await this.getPlugin(this.id);
        this.snack.success("Settings updated");
      } catch (err) {
        this.snack.error(`Error: ${err}`);
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
        this.snack.error(`Error: ${err}`);
      }
    },
    getPlugin(id) {
      pluginApi
        .getPlugin(id)
        .then((data) => {
          this.plugin = data;
          this.initialLoad = true;
        })
        .catch((err) => {
          console.error(err);
          this.snack.error(`Failed to load resource: ${err}`);
          this.errorState = true;
        });
    },
  },
};
</script>
