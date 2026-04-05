<template>
  <div>
    <Teleport v-if="!isNew" defer to="#app-bar-extension">
      <div style="display: flex; flex-direction: row; width: 100%">
        <v-tabs v-model="tab" color="primary" align-with-title>
          <v-tab key="view" value="view">
            View
            <v-icon size="x-small" class="ml-1"> fa-eye </v-icon>
          </v-tab>
          <v-tab key="autorun" value="autorun">
            Autorun
            <v-icon size="x-small" class="ml-1"> fa-play </v-icon>
          </v-tab>
        </v-tabs>
      </div>
    </Teleport>

    <edit-page-top
      :breads="breads"
      :show-submit="initialLoad"
      :disable-submit="!canEdit && initialLoad"
      :show-copy="id > 0 && initialLoad"
      :show-delete="id > 0 && initialLoad"
      :submit-loading="loading"
      :copy-link="copyLink"
      :small-copy="true"
      :small-delete="true"
      @submit="submit"
      @delete="kill"
    >
      <template #extra-stuff>
        <v-switch
          v-if="!isNew && initialLoad"
          v-model="listener.enabled"
          color="green"
          label="Enabled"
          hide-details
          class="mr-2"
          @update:model-value="toggleEnabled"
        />
        <v-menu v-if="!isNew && initialLoad" open-on-hover>
          <template #activator="{ props: activatorProps }">
            <v-btn
              class="mr-5"
              variant="text"
              icon
              size="small"
              v-bind="activatorProps"
            >
              <v-icon>fa-suitcase-rolling</v-icon>
            </v-btn>
          </template>
          <v-list class="ml-2 mr-2">
            <v-list-item
              v-for="(item, index) in commonStagers"
              :key="index"
              link
              :to="{
                name: 'stagerNew',
                query: { template: item, listener: listener.name },
              }"
            >
              <v-list-item-title>
                {{ item }}
              </v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item link :to="{ name: 'stagerNew' }">
              <v-list-item-title> Other </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </edit-page-top>

    <!-- Error Alert -->
    <error-state-alert
      v-if="errorState"
      :resource-id="id"
      resource-type="listener"
    />

    <!-- Tab Items -->
    <v-window v-else v-model="tab">
      <!-- General Tab Content -->
      <v-window-item
        key="view"
        value="view"
        :transition="false"
        :reverse-transition="false"
      >
        <v-card flat>
          <div class="headers" style="padding: 20px">
            <h3>{{ mode }} Listener</h3>
          </div>
          <tag-viewer
            v-if="!isNew"
            :tags="listener.tags"
            @update-tag="updateTag"
            @delete-tag="deleteTag"
            @new-tag="addTag"
          />
          <error-state-alert
            v-if="errorState"
            :resource-id="id"
            resource-type="listener"
          />
          <v-card v-else style="padding: 10px">
            <info-viewer class="info-viewer" :info="listenerInfo" />
            <v-autocomplete
              v-model="selectedTemplate"
              :items="listenerTemplateIds"
              :loading="loadingTemplate"
              density="compact"
              variant="outlined"
              label="Type"
              :readonly="!canEdit"
            />
            <v-alert v-if="validationMessage" prominent type="warning">
              <v-row align="center">
                <v-col class="grow" style="word-wrap: word-break; width: 500px">
                  {{ validationMessage }}
                </v-col>
              </v-row>
            </v-alert>
            <general-form
              v-if="initialLoad"
              :key="selectedTemplate"
              ref="generalform"
              v-model="form"
              :options="listenerOptions"
              :priority="formPriorities"
              :readonly="!canEdit"
            />
          </v-card>
        </v-card>
      </v-window-item>

      <!-- Autorun Modules Tab Content -->
      <v-window-item
        key="autorun"
        value="autorun"
        :transition="false"
        :reverse-transition="false"
      >
        <v-card flat>
          <AutoRunModules :selected-listener="listener" />
        </v-card>
      </v-window-item>
    </v-window>
  </div>
</template>

<script>
import * as listenerApi from "@/api/listener-api";
import GeneralForm from "@/components/GeneralForm.vue";
import InfoViewer from "@/components/InfoViewer.vue";
import EditPageTop from "@/components/EditPageTop.vue";
import ErrorStateAlert from "@/components/ErrorStateAlert.vue";
import TagViewer from "@/components/TagViewer.vue";
import AutoRunModules from "@/components/AutoRunModules.vue";
import { useListenerStore } from "@/stores/listener-module";

export default {
  name: "ListenerEdit",
  components: {
    TagViewer,
    InfoViewer,
    GeneralForm,
    ErrorStateAlert,
    EditPageTop,
    AutoRunModules,
  },
  inject: ["snack", "confirm"],
  data() {
    return {
      listener: { options: {} },
      listenerTemplate: { options: {} },
      selectedTemplate: "",
      form: {},
      loading: false,
      loadingTemplate: false,
      formPriorities: ["Name", "Host", "Port"],
      errorState: false,
      validationMessage: null,
      initialLoad: false,
      commonStagers: [
        "multi_launcher",
        "multi_macro",
        "windows_csharp_exe",
        "windows_dll",
        "windows_shellcode",
      ],
    };
  },
  computed: {
    listenerStore() {
      return useListenerStore();
    },
    listenerTemplateIds() {
      return this.listenerStore.templateIds;
    },
    isNew() {
      return this.$route.name === "listenerNew";
    },
    isCopy() {
      return this.$route.query.copy === "true";
    },
    mode() {
      if (this.isCopy) return "Copy";
      if (this.isNew) return "New";
      return "View";
    },
    canEdit() {
      return this.isNew || !this.listener.enabled;
    },
    id() {
      return this.isCopy ? 0 : this.$route.params.id || this.$route.query.id;
    },
    copyLink() {
      if (this.id > 0)
        return { name: "listenerNew", query: { copy: true, id: this.id } };
      return {};
    },
    listenerInfo() {
      if (!this.listenerTemplate) return {};
      const a = this.listenerTemplate;
      return {
        authors: a.authors,
        description: a.description,
        comments: a.comments,
      };
    },
    listenerOptions() {
      if (!this.isNew || this.isCopy) {
        const options = {};
        Object.keys(this.listener.options).forEach((key) => {
          options[key] = { ...this.listenerTemplate.options[key] };
          options[key].value = this.listener.options[key];
        });
        return options;
      }
      const templateOptions =
        (this.listenerTemplate && this.listenerTemplate.options) || {};
      const options = Object.keys(templateOptions).reduce((acc, k) => {
        acc[k] = { ...templateOptions[k] };
        return acc;
      }, {});
      if (Object.keys(options).length === 0) return {};
      return options;
    },
    breads() {
      return [
        {
          title: "Listeners",
          disabled: false,
          to: "/listeners",
          exact: true,
        },
        {
          title: this.breadcrumbName,
          disabled: true,
          to: `/listeners/${this.id}`,
        },
      ];
    },
    breadcrumbName() {
      if (this.isCopy) return "New";
      if (this.listener.name) return this.listener.name;
      if (this.id) return this.id;
      return "New";
    },
    tab: {
      get() {
        return this.$route.query.tab || "view";
      },
      set(tab) {
        this.$router.replace({ query: { ...this.$route.query, tab } });
      },
    },
  },
  watch: {
    selectedTemplate: {
      async handler(val) {
        this.loadingTemplate = true;
        const a = await listenerApi
          .getListenerTemplate(val)
          .catch((err) =>
            this.snack.error(
              `Error: ${err?.response?.data?.detail || err?.message || err}`,
            ),
          );
        this.loadingTemplate = false;
        if (a) {
          this.listenerTemplate = a;
          this.initialLoad = true;
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
    this.listenerStore.getListenerTemplates();

    if (!this.isNew || this.isCopy) {
      // using the route param id instead of this.id
      // since this.id is 0 for copies.
      this.getListener(this.$route.params.id || this.$route.query.id);
    }
  },
  methods: {
    deleteTag(tag) {
      listenerApi
        .deleteTag(this.listener.id, tag.id)
        .then(() => {
          this.listener.tags = this.listener.tags.filter(
            (t) => t.id !== tag.id,
          );
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    updateTag(tag) {
      listenerApi
        .updateTag(this.listener.id, tag)
        .then((t) => {
          const index = this.listener.tags.findIndex((x) => x.id === t.id);
          this.listener.tags.splice(index, 1, t);
          this.snack.success("Tag updated");
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    addTag(tag) {
      listenerApi
        .addTag(this.listener.id, tag)
        .then((t) => {
          this.listener.tags.push(t);
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    async submit() {
      if (this.loading) return;
      const valid = await this.$refs.generalform.validate();
      if (!valid) return;

      this.loading = true;
      if (this.id > 0) {
        listenerApi
          .updateListener({ ...this.listener, options: this.form })
          .then(() => {
            this.snack.success("Listener updated");
            this.loading = false;
          })
          .catch((err) => {
            if (err.startsWith("[*]")) {
              this.validationMessage = err;
            } else {
              this.snack.error(`Error: ${err}`);
            }
            this.loading = false;
          });
      } else {
        listenerApi
          .createListener(this.selectedTemplate, this.form)
          .then(({ id }) => {
            this.snack.success("Listener created");
            this.loading = false;
            this.$router.push({ name: "listenerEdit", params: { id } });
          })
          .catch((err) => {
            if (err.startsWith("[*]")) {
              this.validationMessage = err;
            } else {
              this.snack.error(`Error: ${err}`);
            }
            this.loading = false;
          });
      }
    },
    async kill() {
      if (
        await this.confirm(
          "Delete",
          `Are you sure you want to kill listener ${this.form.Name}?`,
          { color: "red" },
        )
      ) {
        try {
          await this.listenerStore.killListener(this.id);
          this.$router.push({ name: "listeners" });
        } catch (err) {
          this.snack.error(`Error: ${err}`);
        }
      }
    },
    getListener(id) {
      listenerApi
        .getListener(id)
        .then((data) => {
          this.listener = data;
          this.listener.tags.forEach((tag) => {
            tag.color = tag.color || "#0E0CDA";
          });
          this.selectedTemplate = data.template;
        })
        .catch((err) => {
          console.error(err);
          this.snack.error(`Failed to load resource: ${err}`);
          this.errorState = true;
        });
    },
    async toggleEnabled(val) {
      this.listener.enabled = val;

      if (
        val === true &&
        !(await this.confirm(
          "",
          "Re-enabling the listener will also save any unsaved option changes.",
          { color: "yellow" },
        ))
      ) {
        this.listener.enabled = !val;
        return;
      }

      try {
        const response = await listenerApi.updateListener({
          ...this.listener,
          options: this.form,
        });
        this.listener = response;
      } catch (err) {
        this.listener.enabled = !val;
        this.snack.error(`Error: ${err}`);
      }
    },
  },
};
</script>
