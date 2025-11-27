<template>
  <div style="padding: 20px">
    <!-- Available Modules Section -->
    <v-row>
      <v-col>
        <h3>Available Modules</h3>
        <v-row>
          <v-col cols="8">
            <v-autocomplete
              v-model="selectedModule"
              :items="availableModuleOptions"
              label="Select Module to Add"
              item-value="id"
              item-text="name"
              :menu-props="{ maxHeight: '300px', offsetY: true, nudgeTop: 5 }"
              outlined
              dense
              clearable
              :search-input.sync="searchText"
            />
          </v-col>
          <v-col cols="4">
            <v-btn
              color="green"
              :disabled="!selectedModule"
              @click="addModuleToList"
            >
              Add Module
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Selected Modules Section -->
    <v-row>
      <v-col>
        <h3>Selected Modules</h3>
        <draggable v-model="moduleList" group="modules" handle=".handle">
          <div
            v-for="(module, index) in moduleList"
            :key="module.id || module.module_id"
            class="module-block"
          >
            <v-card style="padding: 10px">
              <div
                class="handle"
                style="
                  cursor: grab;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin-bottom: 5px;
                "
              >
                <div style="display: flex; align-items: center;">
                  <v-icon left>mdi-drag-horizontal</v-icon>
                  {{ index + 1 }}. {{ module.id || module.module_id }}
                </div>
                <div style="display: flex; gap: 10px;">
                  <v-btn
                    small
                    color="primary"
                    @click="openOptionsDialog(module, index)"
                  >
                    Edit Options
                  </v-btn>
                  <v-btn
                    small
                    color="red"
                    @click="removeModuleFromList(index)"
                  >
                    Delete
                  </v-btn>
                </div>
              </div>
            </v-card>
          </div>
        </draggable>
      </v-col>
    </v-row>

    <!-- Save Button -->
    <v-row>
      <v-col>
        <v-btn
          color="primary"
          style="margin-top: 20px"
          @click.prevent="saveAutorunTasks"
        >
          Save Autorun Modules
        </v-btn>
      </v-col>
    </v-row>

    <!-- Options Dialog -->
    <v-dialog v-model="showDialog" max-width="900px">
      <v-card class="autorun-options-card">
        <v-card-title>
          <span class="headline">Options</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="optionsForm" @submit.prevent>
            <general-form
              v-if="dialogOptions"
              :key="dialogFormKey"
              ref="generalform"
              v-model="selectedModuleForm"
              :options="dialogOptions"
              :readonly="false"
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="blue darken-1" text @click="showDialog = false">
            Cancel
          </v-btn>
          <v-btn color="orange darken-1" dark @click="saveOptions">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import { useModuleStore } from "@/stores/module-module";
import GeneralForm from "@/components/GeneralForm.vue";
import { getAutorunTasks, saveAutorunTasks } from "@/api/listener-api"; // Import the correct API methods

export default {
  name: "AutoRunModules",
  components: { draggable, GeneralForm },
  props: {
    selectedListener: {
      type: Object,
      required: true, // The selected listener must be passed as a prop
    },
  },
  data() {
    return {
      selectedModule: null, // Selected module to be added
      moduleList: [], // Default empty module list
      availableModules: [], // List of available modules to add
      showDialog: false, // Show/Hide options dialog
      selectedModuleForEdit: null, // Module selected for editing options
      searchText: "", // Track search input for autocomplete
      selectedModuleForm: {},
      dialogOptions: null,
      dialogFormKey: 0,
      editingModuleIndex: -1,
    };
  },
  computed: {
    availableModuleOptions() {
      if (!this.searchText) {
        return this.availableModules.map((module) => ({
          id: module.id,
          name: `${module.id}`,
        }));
      }

      // Filtered search results based on search text
      return this.availableModules
        .filter((module) =>
          module.id.toLowerCase().includes(this.searchText.toLowerCase()),
        )
        .map((module) => ({
          id: module.id,
          name: `${module.id}`,
        }));
    },
  },
  watch: {
    selectedListener: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.fetchAutorunTasks(newVal);
        }
      },
    },
  },
  mounted() {
    this.fetchAvailableModules();
  },
  methods: {
    async fetchAutorunTasks(listener) {
      if (listener) {
        try {
          const tasks = await getAutorunTasks(listener.id);

          // Fetch available modules
          await this.fetchAvailableModules();

          // Merge module metadata from availableModules with fetched tasks
          this.moduleList = tasks.map((task) => {
            const availableModule = this.availableModules.find(
              (m) => m.id === task.module_id,
            );

            if (availableModule) {
              return {
                ...availableModule, // Merge with available module metadata
                ...task, // Keep the returned task information
                options: this.mergeModuleOptions(
                  availableModule.options,
                  task.options,
                ),
              };
            }
            return task; // If no available module found, keep the task as is
          });
        } catch (error) {
          console.error("Failed to fetch autorun tasks", error);
        }
      }
    },
    async fetchAvailableModules() {
      const moduleStore = useModuleStore();
      await moduleStore.getModules();
      this.availableModules = moduleStore.modules;
    },
    mergeModuleOptions(availableOptions, taskOptions) {
      // Merge the available module options with the task options
      return Object.keys(availableOptions).reduce((mergedOptions, key) => {
        mergedOptions[key] = {
          ...availableOptions[key], // Use the metadata from available options
          value:
            taskOptions[key] !== undefined
              ? taskOptions[key]
              : availableOptions[key].value,
        };
        return mergedOptions;
      }, {});
    },
    addModuleToList() {
      if (this.selectedModule) {
        const module = this.availableModules.find(
          (mod) => mod.id === this.selectedModule,
        );
        if (module) {
          this.moduleList.push({ ...module, options: module.options || {} });
          this.selectedModule = null;
        }
      }
    },
    async saveAutorunTasks() {
      const modulesWithMissing = this.moduleList
        .map((module) => ({
          module,
          missing: this.getMissingRequiredOptions(module),
        }))
        .filter((item) => item.missing.length > 0);

      if (modulesWithMissing.length > 0) {
        const details = modulesWithMissing
          .map(
            ({ module, missing }) =>
              `${module.id || module.module_id}: ${missing.join(", ")}`,
          )
          .join(" | ");
        this.$snack.error(
          `Missing required options for autorun modules → ${details}`,
        );
        return;
      }

      // Always send the cleaned modules to the API, even if the list is empty
      const cleanedModules = this.moduleList.map((module) => {
        // Extract only the key-value pairs from the options object
        const cleanedOptions = Object.keys(module.options).reduce(
          (acc, key) => {
            acc[key] = module.options[key].value; // Get the 'value' property only
            return acc;
          },
          {},
        );

        return {
          module_id: module.id, // The id of the module
          ignore_language_version_check: false, // Set this according to your use case
          ignore_admin_check: false, // Set this according to your use case
          options: cleanedOptions, // Use the cleaned options
        };
      });

      try {
        // Send the cleanedModules (even if it's an empty array) directly to the server
        await saveAutorunTasks(this.selectedListener.id, cleanedModules);
        this.$snack.success("Autorun modules saved.");
      } catch (error) {
        this.$snack.error("Failed to save autorun modules.");
        console.error("Failed to save autorun modules", error);
      }
    },
    openOptionsDialog(module, index) {
      this.selectedModuleForEdit = { ...module };
      this.editingModuleIndex = index;
      this.dialogOptions = this.cloneModuleOptions(module.options || {});
      this.dialogFormKey += 1;
      this.selectedModuleForm = {};
      this.showDialog = true;
    },
    saveOptions() {
      if (this.editingModuleIndex === -1) {
        this.showDialog = false;
        return;
      }

      const isValid = this.$refs.generalform?.$refs.form.validate?.();
      if (isValid === false) {
        return;
      }

      const updatedModule = {
        ...this.moduleList[this.editingModuleIndex],
        options: this.applyFormValuesToOptions(
          this.moduleList[this.editingModuleIndex].options || {},
          this.selectedModuleForm,
        ),
      };

      this.$set(this.moduleList, this.editingModuleIndex, updatedModule);
      this.showDialog = false;
      this.editingModuleIndex = -1;
      this.dialogOptions = null;
    },
    cloneModuleOptions(options) {
      const cloned = JSON.parse(JSON.stringify(options || {}));
      if (cloned.Agent) {
        delete cloned.Agent;
      }
      return cloned;
    },
    applyFormValuesToOptions(options, formValues) {
      const updatedOptions = JSON.parse(JSON.stringify(options));
      Object.keys(updatedOptions).forEach((key) => {
        if (key === "Agent") return;
        if (formValues[key] !== undefined) {
          updatedOptions[key].value = formValues[key];
        }
      });
      return updatedOptions;
    },
    removeModuleFromList(index) {
      // Remove the module at the given index
      this.moduleList.splice(index, 1);
    },
    getMissingRequiredOptions(module) {
      if (!module || !module.options) return [];

      return Object.entries(module.options)
        .filter(
          ([key, option]) => option.required === true && key.toLowerCase() !== "agent",
        )
        .reduce((missing, [key, option]) => {
          const value = option.value;
          const isEmptyString = typeof value === "string" && value.trim() === "";
          const isEmptyArray = Array.isArray(value) && value.length === 0;
          const isUnset = value === null || value === undefined;

          if (isUnset || isEmptyString || isEmptyArray) {
            missing.push(key);
          }

          return missing;
        }, []);
    },
  },
};
</script>

<style scoped>
.module-block {
  margin-bottom: 10px;
  border: 1px solid #ccc; /* Gray border */
  padding: 2px;
  border-radius: 4px; /* Optional: slightly round the corners */
}

.handle {
  cursor: grab;
  display: flex;
  align-items: center;
}

.v-icon {
  margin-right: 10px; /* Add some spacing to the icon */
}

.autorun-options-card {
  padding: 20px;
}
</style>
