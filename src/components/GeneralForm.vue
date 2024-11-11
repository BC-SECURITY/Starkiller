<template>
  <v-form
    ref="form"
    v-model="valid"
    :readonly="readonly"
    @submit.prevent.native="submit"
  >
    <v-row
      v-for="field in requiredFields"
      :key="field.name"
      :class="{ 'highlight-flash': recentlyVisibleFields.includes(field.name) }"
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

    <v-subheader v-if="optionalFields.length > 0">Optional Fields</v-subheader>
    <v-divider v-if="optionalFields.length > 0" class="mb-8" />
    <v-row
      v-for="field in optionalFields"
      :key="field.name"
      :class="{ 'highlight-flash': recentlyVisibleFields.includes(field.name) }"
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
  </v-form>
</template>
<script>
import Vue from "vue";
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
      visibleFields: {},
      recentlyVisibleFields: [],
    };
  },
  computed: {
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
      return this.allFields.filter(
        (el) => el.required === false && this.isFieldVisible(el),
      );
    },
    requiredFields() {
      return this.allFields.filter(
        (el) => el.required === true && this.isFieldVisible(el),
      );
    },
    allFields() {
      const fields = Object.keys(this.options).map((key) => ({
        name: key,
        ...this.options[key],
      }));

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
      return this.allFields.reduce((map, field) => {
        if (this.isFieldVisible(field)) {
          map[field.name] = [];
          if (field.required === true) {
            map[field.name].push((v) => !!v || `${field.name} is required`);
          }
        }
        return map;
      }, {});
    },
  },
  watch: {
    options: {
      immediate: true,
      handler(newOptions) {
        this.initializeForm(newOptions);
      },
    },
    form: {
      handler(val) {
        this.updateFieldVisibility(val);
        const updatedForm = { ...val };

        if (updatedForm.Bypasses) {
          updatedForm.Bypasses = updatedForm.Bypasses.join(" ");
        }

        this.$emit("input", updatedForm);
      },
      deep: true,
    },
    allFields: {
      immediate: true,
      handler(arr) {
        const map2 = arr.reduce((map, obj) => {
          if (obj.name === "Bypasses" && !Array.isArray(obj.value)) {
            map[obj.name] = obj.value.split(" ") || [];
          } else {
            map[obj.name] = obj.value == null ? "" : obj.value;
          }
          return map;
        }, {});
        Vue.set(this, "form", map2);
      },
    },
  },
  mounted() {
    this.agentStore.getAgents();
    this.listenerStore.getListeners();
    this.bypassStore.getBypasses();
    this.malleableProfileStore.getMalleableProfiles();
    this.credentialStore.getCredentials();
    this.updateFieldVisibility(this.form, true);
  },
  methods: {
    initializeForm(options) {
      this.form = {};
      Object.keys(options).forEach((key) => {
        this.$set(this.form, key, options[key].value || null);
      });
    },
    updateFieldVisibility(form, initial = false) {
      const newlyVisibleFields = [];
      const oldVisibleFields = { ...this.visibleFields };
      this.visibleFields = {};
      this.allFields.forEach((field) => {
        if (field.depends_on && Array.isArray(field.depends_on)) {
          const shouldBeVisible = field.depends_on.every((dependency) =>
            dependency.values.includes(form[dependency.name]),
          );
          if (shouldBeVisible && !oldVisibleFields[field.name]) {
            if (!initial) newlyVisibleFields.push(field.name);
          }
          this.$set(this.visibleFields, field.name, shouldBeVisible);
        } else {
          if (!this.visibleFields[field.name]) {
            if (!initial) newlyVisibleFields.push(field.name);
          }
          this.$set(this.visibleFields, field.name, true);
        }
      });

      this.highlightNewlyVisibleFields(newlyVisibleFields);
    },
    highlightNewlyVisibleFields(fields) {
      this.recentlyVisibleFields = fields;
      setTimeout(() => {
        this.recentlyVisibleFields = [];
      }, 7000);
    },
    isFieldVisible(field) {
      return this.visibleFields[field.name] !== false;
    },
    suggestedValuesForField(field) {
      if (field.name === "Agent") return this.agents;
      if (["Listener", "RedirectListener"].includes(field.name))
        return this.listeners;
      if (field.name === "Bypasses") return this.bypasses;
      if (field.name === "Profile") return this.malleableProfiles;
      if (field.name === "CredID") return this.credentials;
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
  },
};
</script>

<style scoped>
.highlight-flash {
  animation: flash 1s ease-in-out;
}

@keyframes flash {
  0% {
  }
  50% {
    opacity: 1;
    background-color: #676767;
    box-shadow: 0 0 5px 5px #676767;
  }
  100% {
  }
}
</style>
