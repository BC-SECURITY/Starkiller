<template>
  <div>
    <error-state-alert
      v-if="errorState"
      :resource-id="moduleName"
      resource-type="module"
      :message="errorStateMessage"
    />
    <div v-else style="padding: 0 10px 10px 10px">
      <info-viewer class="info-viewer" :info="moduleInfo" />
      <span class="mr-2 mb-4">
        Executing on Agents:
        {{ agents.map((agent) => agent.name || agent.session_id).join(", ") }}
      </span>
      <technique-chips :techniques="selectedItem.techniques" />

      <v-alert
        v-if="reset && modules.length > 0 && autocompleteOptions.length === 0"
        type="error"
      >
        No modules are compatible with all selected agents.
      </v-alert>

      <v-row>
        <v-col cols="11">
          <v-autocomplete
            v-model="selectedModule"
            :items="autocompleteOptions"
            item-text="text"
            item-value="value"
            :loading="!reset"
            placeholder="Search module..."
            outlined
            dense
            clearable
            @change="handleSelect"
          />
        </v-col>

        <v-col cols="1" class="d-flex align-center" style="margin-top: -25px">
          <tooltip-button
            :icon="showTreeDialog ? 'mdi-folder-open' : 'mdi-folder'"
            color="grey lighten-2"
            tooltip="Browse modules by folder"
            @click="toggleTree"
          />
        </v-col>
      </v-row>

      <v-dialog v-model="showTreeDialog" max-width="500px">
        <v-card>
          <v-card-title>
            <span class="headline">Browse Modules</span>
          </v-card-title>
          <v-card-text>
            <v-treeview
              :items="treeOptions"
              open-on-click
              activatable
              :active.sync="treeSelected"
              :open.sync="treeOpen"
              item-key="id"
              item-text="name"
              item-children="children"
              @update:active="handleTreeSelect"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn text color="primary" @click="showTreeDialog = false"
              >Close</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-alert v-if="selectedItem.opsec_safe === false" type="warning">
        <v-row align="center">
          <v-col
            class="grow"
            style="word-wrap: break-word; word-break: break-word; width: 500px"
          >
            This module is not opsec safe.
          </v-col>
        </v-row>
      </v-alert>

      <div
        v-if="Object.keys(selectedItem).length > 0"
        style="display: flex; flex-direction: row"
      >
        <v-checkbox
          v-model="ignoreAdminCheck"
          class="pa-1"
          label="Ignore Admin Check"
          color="primary"
        />
        <v-checkbox
          v-model="ignoreLanguageCheck"
          class="pa-1"
          label="Ignore Language Version Check"
          color="primary"
        />
      </div>

      <general-form
        v-if="reset"
        ref="generalform"
        v-model="form"
        :options="moduleOptions"
      />

      <v-btn
        v-if="selectedModule"
        :loading="loading"
        color="primary"
        @click="create"
      >
        Submit
      </v-btn>

      <v-dialog ref="nameDialog" v-model="showDialog" max-width="900px">
        <v-card>
          <v-card-title>
            <span class="headline">Execution Result</span>
          </v-card-title>
          <v-card-text>
            <v-data-table
              dense
              :items="results"
              :headers="headers"
              :item-class="rowClass"
            >
              <template #item.agent="{ item }">
                <div>
                  <template v-if="item.status === 'rejected'">
                    <span>{{ item.reason.agent }}</span>
                  </template>
                  <template v-else>
                    <span>{{ item.value.agent }}</span>
                  </template>
                </div>
              </template>
              <template #item.result="{ item }">
                <div>
                  <template v-if="item.status === 'rejected'">
                    <span>{{ item.reason.error }}</span>
                  </template>
                  <template v-else>
                    <span>{{ item.value.message }}</span>
                  </template>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue darken-1" text @click="showDialog = false">
              Okay
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script>
import InfoViewer from "@/components/InfoViewer.vue";
import * as moduleApi from "@/api/module-api";
import ErrorStateAlert from "@/components/ErrorStateAlert.vue";
import { useModuleStore } from "@/stores/module-module";
import GeneralForm from "../GeneralForm.vue";
import TechniqueChips from "../TechniqueChips.vue";

export default {
  components: {
    InfoViewer,
    GeneralForm,
    TechniqueChips,
    ErrorStateAlert,
  },
  props: {
    agents: {
      type: Array,
      default: () => [],
    },
    showSubmit: {
      type: Boolean,
      default: true,
    },
    moduleName: {
      type: String,
      default: "",
    },
    moduleOptionDefaults: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      loading: false,
      selectedModule: "",
      selectedItem: {},
      results: [],
      reset: true,
      headers: [
        { text: "Agent", value: "agent" },
        { text: "Result", value: "result" },
      ],
      showDialog: false,
      form: {},
      errorState: false,
      ignoreAdminCheck: false,
      ignoreLanguageCheck: false,
      treeSelected: [],
      treeOpen: [],
      showTreeDialog: false,
    };
  },
  computed: {
    moduleStore() {
      return useModuleStore();
    },
    modules() {
      return this.moduleStore.modules.filter((el) => el.enabled);
    },
    compatibleModules() {
      if (!this.agents.length) return this.modules;
      const getCompatibleLanguages = (agentLang) => {
        switch ((agentLang || "").toLowerCase()) {
          case "powershell":
          case "csharp":
          case "go":
            return ["powershell", "csharp", "bof"];
          case "ironpython":
            return ["powershell", "csharp", "bof", "python"];
          case "python":
            return ["python"];
          default:
            return [];
        }
      };
      const agentLangSets = this.agents.map((agent) =>
        getCompatibleLanguages(agent.language || agent.type),
      );
      const sharedLangs = agentLangSets.reduce((acc, curr) =>
        acc.filter((lang) => curr.includes(lang)),
      );
      return this.modules.filter((mod) =>
        sharedLangs.includes(mod.language?.toLowerCase()),
      );
    },
    autocompleteOptions() {
      return this.compatibleModules.map((mod) => ({
        text: mod.id,
        value: mod.id,
      }));
    },
    treeOptions() {
      const structure = {};
      this.compatibleModules.forEach((mod) => {
        const parts = mod.id.split("_");
        const language = parts[0] || "unknown";

        let category = parts[1] || "uncategorized";
        if (
          parts.length >= 3 &&
          ["situational", "lateral", "code"].includes(parts[1])
        ) {
          const joined = `${parts[1]}_${parts[2]}`;
          if (
            [
              "situational_awareness",
              "lateral_movement",
              "code_execution",
            ].includes(joined)
          ) {
            category = joined;
          }
        }

        if (!structure[language]) structure[language] = {};
        if (!structure[language][category]) structure[language][category] = [];
        structure[language][category].push({
          id: mod.id,
          name: mod.id,
        });
      });

      return Object.entries(structure)
        .sort(([langA], [langB]) => langA.localeCompare(langB)) // Sort languages
        .map(([lang, categories]) => {
          const children = Object.entries(categories)
            .sort(([catA], [catB]) => catA.localeCompare(catB)) // Sort categories
            .flatMap(([cat, modules]) => {
              modules.sort((a, b) => a.name.localeCompare(b.name)); // Sort modules

              if (modules.length === 1) {
                return modules;
              }
              return {
                id: `${lang}_${cat}`,
                name: cat,
                children: modules,
              };
            });

          return {
            id: lang,
            name: lang,
            children,
          };
        });
    },
    moduleOptions() {
      const options = this.selectedItem.options || {};
      if (options.Agent) delete options.Agent;
      Object.keys(this.moduleOptionDefaults || {}).forEach((key) => {
        if (options[key]) options[key].value = this.moduleOptionDefaults[key];
      });
      return options;
    },
    moduleInfo() {
      if (Object.keys(this.selectedItem).length === 0) return {};
      return {
        authors: this.selectedItem.authors,
        description: this.selectedItem.description,
        comments: this.selectedItem.comments,
        extraDetails: [
          { key: "Language", value: this.selectedItem.language },
          {
            key: "MinLanguageVersion",
            value: this.selectedItem.min_language_version,
          },
          { key: "Background", value: this.selectedItem.background },
          { key: "OpsecSafe", value: this.selectedItem.opsec_safe },
          { key: "NeedsAdmin", value: this.selectedItem.needs_admin },
          {
            key: "OutputExtensions",
            value: this.selectedItem.output_extensions,
          },
        ],
      };
    },
    errorStateMessage() {
      return `The resource 'module/${this.moduleName}' Not Found or is Disabled.`;
    },
  },
  watch: {
    modules(val) {
      if (val.length > 0) {
        this.handleSelect(this.moduleName);
      }
    },
    selectedModule(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.emitModuleChange(newVal);
      }
    },
    moduleName: {
      immediate: true,
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.selectedModule = newVal;
          this.handleSelect(newVal);
        }
      },
    },
  },
  async mounted() {
    await this.moduleStore.getModules();
  },
  methods: {
    toggleTree() {
      this.showTreeDialog = true;
    },
    async handleSelect(item) {
      this.errorState = false;
      if (!item) {
        this.reset = false;
        this.selectedItem = {};
        setTimeout(() => {
          this.reset = true;
        }, 500);
        return;
      }
      const results = this.modules.find((el) => el.id === item);
      this.reset = false;
      this.selectedItem = results || {};
      if (!Object.keys(this.selectedItem).length) {
        this.errorState = true;
      }
      setTimeout(() => {
        this.reset = true;
      }, 500);
    },
    handleTreeSelect(selected) {
      if (selected.length > 0) {
        const moduleId = selected[0];
        const match = this.compatibleModules.find((m) => m.id === moduleId);
        if (match) {
          this.selectedModule = moduleId;
          this.handleSelect(moduleId);
          this.showTreeDialog = false;
        }
      }
    },
    rowClass(item) {
      return item.status === "rejected" ? "red" : "";
    },
    emitModuleChange(newVal) {
      this.$emit("moduleChange", newVal);
    },
    validate() {
      return this.$refs.generalform.$refs.form.validate();
    },
    async create() {
      if (this.agents.length < 1 || this.loading || !this.validate()) return;
      this.loading = true;
      const result = await Promise.allSettled(
        this.agents.map((agent) =>
          moduleApi.executeModule(
            this.selectedModule,
            {
              ...this.form,
              Agent: agent.session_id,
            },
            this.ignoreAdminCheck,
            this.ignoreLanguageCheck,
          ),
        ),
      );
      if (result.some((item) => item.status === "rejected")) {
        const split = result.reduce(
          (acc, val) => {
            acc[val.status].push(val);
            return acc;
          },
          { rejected: [], fulfilled: [] },
        );
        if (this.agents.length > 1) {
          this.$snack.warn(
            `Module failed to execute for ${split.rejected.length} out of ${this.agents.length} agents.`,
          );
          this.results = result;
          this.showDialog = true;
        } else {
          this.$snack.error(`Error: ${result[0].reason.error}`);
        }
      } else {
        const displayName =
          this.agents.length > 1
            ? `${this.agents.length} agents.`
            : `${this.agents[0]}.`;
        this.$snack.info(`Module execution queued for ${displayName}`);
        this.selectedItem = {};
        this.selectedModule = "";
        this.$emit("submitted");
      }
      this.loading = false;
    },
  },
};
</script>

<style scoped lang="scss">
.red {
  background-color: #bd4c4c;
}

.treeview-wrapper {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  background-color: #454545;
}
</style>
