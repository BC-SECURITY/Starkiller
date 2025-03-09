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
                  margin-bottom: 5px;
                "
              >
                <v-icon left>mdi-drag-horizontal</v-icon>
                {{ index + 1 }}. {{ module.id || module.module_id }}
              </div>
              <v-btn small color="primary" @click="openOptionsDialog(module)">
                Edit Options
              </v-btn>
              <v-btn
                small
                color="red"
                style="margin-left: 20px"
                @click="removeModuleFromList(index)"
              >
                Delete
              </v-btn>
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
    <v-dialog v-model="showDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Options</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="optionsForm">
            <v-row>
              <v-col
                v-for="field in filteredOptions"
                :key="field.name"
                cols="12"
              >
                <dynamic-form-input
                  v-model="selectedModuleForEdit.options[field.name].value"
                  :suggested-values="field.suggested_values"
                  :strict="strictForField(field)"
                  :name="field.name"
                  :type="fieldType(field)"
                />
                <v-subheader>{{ field.description }}</v-subheader>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-btn color="blue darken-1" text @click="showDialog = false"
            >Cancel</v-btn
          >
          <v-btn color="blue darken-1" text @click="saveOptions">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import { useModuleStore } from "@/stores/module-module";
import DynamicFormInput from "@/components/DynamicFormInput.vue";
import { getAutorunTasks, saveAutorunTasks } from "@/api/listener-api"; // Import the correct API methods

export default {
  name: "AutoRunModules",
  components: { draggable, DynamicFormInput },
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
    filteredOptions() {
      if (!this.selectedModuleForEdit) return [];
      return Object.keys(this.selectedModuleForEdit.options)
        .map((key) => ({
          name: key,
          ...this.selectedModuleForEdit.options[key],
        }))
        .filter((field) => field.name.toLowerCase() !== "agent");
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
    openOptionsDialog(module) {
      this.selectedModuleForEdit = {
        ...module,
        options: { ...module.options },
      };
      this.showDialog = true;
    },
    saveOptions() {
      const index = this.moduleList.findIndex(
        (mod) => mod.id === this.selectedModuleForEdit.id,
      );
      if (index !== -1) {
        this.$set(this.moduleList, index, this.selectedModuleForEdit);
      }
      this.showDialog = false;
    },
    removeModuleFromList(index) {
      // Remove the module at the given index
      this.moduleList.splice(index, 1);
    },
    fieldType(field) {
      return (
        {
          INTEGER: "number",
          FLOAT: "float",
          BOOLEAN: "boolean",
          STRING: "string",
          FILE: "file",
        }[field.value_type] || "string"
      );
    },
    strictForField(field) {
      return field.strict || false;
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
</style>
