<template>
  <v-dialog v-model="show" max-width="800px">
    <v-card>
      <v-card-title>
        <span class="headline" />
      </v-card-title>
      <v-card-text>
        <agent-interact v-if="show" :agent="agent" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="error" text @click.stop="show = false"> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import AgentInteract from "./AgentInteract.vue";

export default {
  components: {
    AgentInteract,
  },
  props: {
    modelValue: Boolean,
    loading: {
      type: Boolean,
      default: false,
    },
    agent: {
      type: Object,
      required: true,
    },
  },
  emits: ["update:modelValue"],
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
};
</script>
