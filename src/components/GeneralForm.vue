<template>
  <v-form
    ref="form"
    v-model="valid"
    :readonly="readonly"
    @submit.prevent.native="submit"
  >
    <!-- Rendering required fields -->
    <!-- eslint-disable -->
    <v-row
      v-for="field in requiredFields"
      :key="field.name"
      v-if="isFieldVisible(field.name)"
    >
      <v-col cols="6">
        <dynamic-form-input
          v-model="form[field.name]"
          :suggested-values="suggestedValuesForField(field)"
          :strict="strictForField(field)"
          :name="field.name"
          :rules="rules[field.name]"
          :type="field.type"
        />
      </v-col>
      <v-col cols="6">
        <v-subheader>{{ field.description }}</v-subheader>
      </v-col>
    </v-row>

    <!-- Optional fields -->
    <v-subheader v-if="optionalFields.length > 0">Optional Fields</v-subheader>
    <v-divider v-if="optionalFields.length > 0" class="mb-8" />
    <v-row
      v-for="field in optionalFields"
      :key="field.name"
      v-if="isFieldVisible(field.name)"
    >
      <v-col cols="6">
        <dynamic-form-input
          v-model="form[field.name]"
          :suggested-values="suggestedValuesForField(field)"
          :strict="strictForField(field)"
          :name="field.name"
          :rules="rules[field.name]"
          :type="field.type"
        />
      </v-col>
      <v-col cols="6">
        <v-subheader>{{ field.description }}</v-subheader>
      </v-col>
    </v-row>
    <!-- eslint-enable -->
  </v-form>
</template>

<script>
import Vue from "vue";
import debounce from "lodash/debounce";
import { useListenerStore } from "@/stores/listener-module";
import { useBypassStore } from "@/stores/bypass-module";
import { useCredentialStore } from "@/stores/credential-module";
import { useMalleableProfileStore } from "@/stores/malleable-module";
import { useAgentStore } from "@/stores/agent-module";
import DynamicFormInput from "./DynamicFormInput.vue";

export default {
  components: {
    DynamicFormInput,
  },
  props: {
    options: {
      type: Object,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      form: {},
      valid: true,
      visibleFields: {}, // Tracks visibility state of fields
      debouncedHandler: debounce(this.filteredFieldsHandler, 300),
    };
  },
  computed: {
    // Store-related properties
    agentStore() {
      return useAgentStore();
    },
    listenerStore() {
      return useListenerStore();
    },
    bypassStore() {
      return useBypassStore();
    },
    credentialStore() {
      return useCredentialStore();
    },
    malleableProfileStore() {
      return useMalleableProfileStore();
    },
    agents() {
      return this.agentStore.agents;
    },
    listeners() {
      return this.listenerStore.listenerNames;
    },
    bypasses() {
      return this.bypassStore.bypassNames;
    },
    credentials() {
      return this.credentialStore.credentials;
    },
    malleableProfiles() {
      return this.malleableProfileStore.profileNames;
    },
    optionalFields() {
      return this.filteredFields.filter((el) => el.required === false);
    },
    requiredFields() {
      return this.filteredFields.filter((el) => el.required === true);
    },
    filteredFields() {
      // Build field objects and apply filtering
      const fields = Object.keys(this.options).map((key) => ({
        name: key,
        ...this.options[key],
      }));

      // Filter based on visibility conditions
      fields.forEach((field) => {
        const isVisible = this.shouldFieldBeVisible(field);
        this.$set(this.visibleFields, field.name, isVisible);

        // Set default value when revealing the field
        if (
          isVisible &&
          !this.form[field.name] &&
          this.options[field.name]?.value !== undefined
        ) {
          Vue.set(this.form, field.name, this.options[field.name].value);
        }
      });

      // Prioritize fields based on input priority list
      this.priority
        .slice()
        .reverse()
        .forEach((item) => {
          const index = fields.findIndex((f) => f.name === item);
          if (index > -1) {
            const fItem = fields.splice(index, 1)[0];
            fields.unshift(fItem);
          }
        });

      return fields.map((el) => ({
        ...el,
        type: this.fieldType(el),
      }));
    },
    rules() {
      return this.filteredFields.reduce((map, field) => {
        map[field.name] = [];
        if (field.required === true) {
          map[field.name].push((v) => !!v || `${field.name} is required`);
        }
        return map;
      }, {});
    },
  },
  watch: {
    form: {
      handler(val) {
        const form2 = { ...val };
        if (Array.isArray(form2.Bypasses)) {
          form2.Bypasses = form2.Bypasses.join(" ");
        }
        this.$emit("input", form2);
      },
      deep: true,
    },
    filteredFields: {
      immediate: true,
      handler(arr, oldArr) {
        this.debouncedHandler(arr, oldArr);
      },
    },
  },
  mounted() {
    this.agentStore.getAgents();
    this.listenerStore.getListeners();
    this.bypassStore.getBypasses();
    this.malleableProfileStore.getMalleableProfiles();
    this.credentialStore.getCredentials();
  },
  methods: {
    suggestedValuesForField(field) {
      if (field.name === "Agent") {
        return this.agents;
      }
      if (["Listener", "RedirectListener"].includes(field.name)) {
        return this.listeners;
      }
      if (field.name === "Bypasses") {
        return this.bypasses;
      }
      if (field.name === "Profile") {
        return this.malleableProfiles;
      }
      if (field.name === "CredID") {
        return this.credentials;
      }
      return field.suggested_values;
    },
    strictForField(field) {
      return ["Listener", "Bypasses", "Profile", "CredID"].includes(field.name)
        ? true
        : field.strict;
    },
    fieldType(el) {
      return (
        {
          INTEGER: "number",
          FLOAT: "float",
          BOOLEAN: "boolean",
          STRING: "string",
          FILE: "file",
        }[el.value_type] || "string"
      );
    },
    filteredFieldsHandler(arr, oldArr = []) {
      if (!Array.isArray(arr)) {
        console.error(
          "filteredFieldsHandler expected an array for arr, but received:",
          arr,
        );
        return;
      }

      if (arr.length !== oldArr.length) {
        const map2 = arr.reduce((map, obj) => {
          if (obj.name === "Bypasses" && typeof obj.value === "string") {
            map[obj.name] = obj.value.split(" ") || [];
          } else {
            map[obj.name] = obj.value == null ? "" : obj.value;
          }
          return map;
        }, {});

        Vue.set(this, "form", map2);

        this.updateDependentFields();
      }
    },
    updateDependentFields() {
      this.filteredFields.forEach((field) => {
        const isVisible = this.shouldFieldBeVisible(field);
        this.$set(this.visibleFields, field.name, isVisible);

        if (
          isVisible &&
          !this.form[field.name] &&
          this.options[field.name]?.value !== undefined
        ) {
          // Set default value when revealing the field
          Vue.set(this.form, field.name, this.options[field.name].value);
        }
      });
    },
    shouldFieldBeVisible(field) {
      if (field.depends_on && Array.isArray(field.depends_on)) {
        return field.depends_on.every((dependency) => {
          const dependentValue = this.form[dependency.name];
          return dependency.values.includes(dependentValue);
        });
      }
      return true;
    },
    isFieldVisible(fieldName) {
      return this.visibleFields[fieldName] !== false;
    },
  },
};
</script>

<style scoped>
.mb-8 {
  margin-bottom: 8px;
}
</style>
