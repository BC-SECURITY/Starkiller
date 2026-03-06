<template>
  <v-dialog ref="downloadDialog" v-model="show" max-width="800px">
    <v-card>
      <v-card-title>
        <span class="headline" />
      </v-card-title>
      <v-card-text>
        <agent-execute-module
          v-if="show"
          ref="executeform"
          :agents="[agent]"
          :module-name="moduleName"
          :module-option-defaults="moduleOptionDefaults"
          :show-submit="false"
          @submitted="submit"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="error" variant="text" @click.stop="show = false">
          Close
        </v-btn>
        <v-btn color="primary" :loading="loading" @click="submit">
          Submit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import AgentExecuteModule from "./AgentExecuteModule.vue";

export default {
  components: {
    AgentExecuteModule,
  },
  props: {
    modelValue: Boolean,
    loading: {
      type: Boolean,
      default: false,
    },
    agent: {
      type: String,
      required: true,
    },
    moduleName: {
      type: String,
      required: true,
    },
    moduleOptionDefaults: {
      type: Object,
      default: () => {},
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {};
  },
  computed: {
    show: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      },
    },
  },
  methods: {
    async submit() {
      if (!this.$refs.executeform.validate()) {
        return;
      }
      this.$refs.executeform.create();
      this.show = false;
    },
  },
};
</script>
