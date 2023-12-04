<template>
  <v-form
    ref="form"
    v-model="valid"
    :readonly="readonly"
    @submit.prevent.native="submit"
  >
    <v-row v-for="field in requiredFields" :key="field.name">
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
        <v-subheader> {{ field.description }} </v-subheader>
      </v-col>
    </v-row>

    <v-subheader v-if="optionalFields.length > 0">
      Optional Fields
    </v-subheader>
    <v-divider v-if="optionalFields.length > 0" class="mb-8" />
    <v-row v-for="field in optionalFields" :key="field.name">
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
        <v-subheader> {{ field.description }} </v-subheader>
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
    /**
     * Fields that go in the "Optional" section
     */
    optionalFields() {
      return this.fields
        .filter((el) => el.required === false)
        .map((el) => ({ ...el, type: this.fieldType(el) }));
    },
    /**
     * All the fields that are marked required by the API
     */
    requiredFields() {
      return this.fields
        .filter((el) => el.required === true)
        .map((el) => ({ ...el, type: this.fieldType(el) }));
    },
    /**
     * The fields from the API to dynamically generate the form.
     * If items are in the `priority` list, they will be moved to the top of
     * their respective sections.
     */
    fields() {
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

      return fields;
    },
    /**
     * The rules for the form, currently this is only to check for empty required fields.
     */
    rules() {
      return this.fields.reduce((map, field) => {
        map[field.name] = [];
        if (field.required === true) {
          map[field.name].push(
            (v) => !!v || v === 0 || `${field.name} is required`,
          );
        }

        return map;
      }, {});
    },
  },
  watch: {
    form: {
      handler(val) {
        const form2 = { ...val };
        if (form2.Bypasses) {
          form2.Bypasses = form2.Bypasses.join(" ");
        }
        this.$emit("input", form2);
      },
      deep: true,
    },
    /**
     * When the fields change, we update the form map and set it for reactivity to take place.
     */
    fields: {
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
      if (field.name === "Listener") {
        return true;
      }
      if (field.name === "Bypasses") {
        return true;
      }
      if (field.name === "Profile") {
        return true;
      }
      if (field.name === "CredID") {
        return true;
      }
      return field.strict;
    },
    fieldExists(name) {
      return this.fields.find((el) => el.name === name);
    },
    fieldType(el) {
      if (el.value_type === "INTEGER") return "number";
      if (el.value_type === "FLOAT") return "float";
      if (el.value_type === "BOOLEAN") return "boolean";
      if (el.value_type === "STRING") return "string";
      if (el.value_type === "FILE") return "file";
      return "string";
    },
  },
};
</script>

<style></style>
