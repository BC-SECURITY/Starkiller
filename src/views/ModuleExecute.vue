<template>
  <div>
    <!-- TODO make agent-execute-module take an array DONE-->
    <!-- TODO Allow  module name as a prop DONE -->
    <!-- TODO Allow user to change module name DONE -->
    <!-- TODO Rename agent-execute-module and module-execute -->
    <v-autocomplete
      v-model="selectedAgents"
      dense
      chips
      multiple
      outlined
      :items="agents"
      item-text="name"
      item-value="name"
    />
    <agent-execute-module
      v-model="moduleName"
      :agents="selectedAgents"
    />
    <span> {{ moduleName }} </span>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import AgentExecuteModule from '@/components/agents/AgentExecuteModule.vue';

export default {
  name: 'ModuleExecute',
  components: {
    AgentExecuteModule,
  },
  data() {
    return {
      selectedAgents: [],
      moduleName: '',
    };
  },
  computed: {
    ...mapState({
      agents: state => state.agent.agents,
    }),
  },
  watch: {
    moduleName(newVal) {
      this.$route.query.module = newVal;
    },
    '$route.query.module': {
      immediate: true,
      handler(newVal) {
        this.moduleName = newVal;
      },
    },
  },
  mounted() {
    this.getAgents();
  },
  methods: {
    getAgents() {
      this.$store.dispatch('agent/getAgents');
    },
  },
};
</script>

<style>

</style>
