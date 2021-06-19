<template>
  <div class="p4">
    <edit-page-top
      :breads="breads"
      :show-submit="true"
      @submit="submit"
    />
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
        ref="executeform"
        :module-name="moduleName"
        :agents="selectedAgents"
        :show-submit="false"
        @moduleChange="moduleChange"
        @submitted="clearAgents"
      />
    </v-card>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import AgentExecuteModule from '@/components/agents/AgentExecuteModule.vue';
import EditPageTop from '@/components/EditPageTop.vue';

export default {
  name: 'ModuleExecute',
  components: {
    AgentExecuteModule,
    EditPageTop,
  },
  data() {
    return {
      selectedAgents: [],
      moduleName: '',
    };
  },
  computed: {
    ...mapState({
      agents: (state) => state.agent.agents,
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
  mounted() {
    this.getAgents();
    this.moduleName = this.$route.query.module;
  },
  methods: {
    submit() {
      // I don't love this but it works.
      this.$refs.executeform.create();
    },
    moduleChange(val) {
      this.moduleName = val;
      this.$route.query.module = val;
    },
    getAgents() {
      this.$store.dispatch('agent/getAgents');
    },
    clearAgents() {
      this.selectedAgents = [];
    },
  },
};
</script>

<style>

</style>
