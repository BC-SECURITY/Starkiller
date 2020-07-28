<template>
  <div class="p4">
    <v-breadcrumbs :items="breads" />
    <h4 class="pl-4 pb-4">
      Execute Module
    </h4>
    <v-autocomplete
      v-model="selectedAgents"
      dense
      outlined
      chips
      multiple
      placeholder="Agents"
      :items="agents"
      item-text="name"
      item-value="name"
    />
    <v-card>
      <agent-execute-module
        v-model="moduleName"
        :agents="selectedAgents"
      />
    </v-card>
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
    breads() {
      return [
        {
          text: 'Modules',
          disabled: false,
          to: '/modules',
          exact: true,
        },
        {
          text: `${this.moduleName}`,
          disabled: true,
          to: '/modules/execute',
        },
      ];
    },
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
