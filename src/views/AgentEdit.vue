<template>
  <div>
    <v-breadcrumbs :items="breads" />
    <div style="height: 84vh">
      <split-pane
        :min-percent="20"
        :default-percent="60"
        split="horizontal"
      >
        <template slot="paneL">
          <!-- <div class="content"> -->
          <v-tabs
            v-model="activeTab"
            class="scrollable-pane"
            small
            grow
          >
            <v-tab
              key="view"
              href="#tab-view"
            >
              View
            </v-tab>
            <v-tab
              v-for="i in tabs"
              :key="i"
              :href="`#tab-${i}`"
            >
              {{ i }}
            </v-tab>
            <v-tab-item
              key="view"
              :value="'tab-view'"
            >
              <v-card
                class="scrollable-pane"
                flat
              >
                <agent-form :agent="agent" />
              </v-card>
            </v-tab-item>
            <v-tab-item
              v-for="i in tabs"
              :key="i"
              :value="'tab-' + i"
            >
              <v-card
                flat
                tile
              >
                <v-card-text>Text</v-card-text>
              </v-card>
            </v-tab-item>
          </v-tabs>
          <!-- </div> -->
        </template>
        <template slot="paneR">
          <div
            ref="bottomScrollable"
            class="bottom-pane"
          >
            <agent-command-viewer
              :name="this.$route.params.id"
            />
          </div>
        </template>
      </split-pane>
    </div>
  </div>
</template>

<script>
import AgentForm from '@/components/agents/AgentForm.vue';
import AgentInteract from '@/components/agents/AgentInteract.vue';
import AgentExecuteModule from '@/components/agents/AgentExecuteModule.vue';
import AgentCommandViewer from '@/components/agents/AgentCommandViewer.vue';
import SplitPane from 'vue-splitpane';
import * as agentApi from '@/api/agent-api';

export default {
  name: 'AgentEdit',
  components: {
    AgentForm,
    AgentInteract,
    AgentExecuteModule,
    AgentCommandViewer,
    SplitPane,
  },
  data() {
    return {
      agent: {},
      activeTab: 'View',
      tabs: [
        // 'View',
        'Shell Command',
        'Module',
        // 'Clear Queued Tasks',
        // 'Kill Agent',
        // 'Remove Agent',
      ],
    };
  },
  computed: {
    breads() {
      return [
        {
          text: 'Agents',
          disabled: false,
          to: '/agents',
          exact: true,
        },
        {
          text: 'Edit',
          disabled: true,
          to: '/agent-edit',
        },
      ];
    },
    id() {
      return this.$route.params.id;
    },
  },
  watch: {
    id(val) {
      if (val) {
        this.getAgent(val);
      }
    },
  },
  mounted() {
    this.getAgent(this.$route.params.id);
  },
  methods: {
    getAgent(id) {
      agentApi.getAgent(id)
        .then((data) => {
          this.agent = data;
        });
    },
  },
};
</script>

<style>


.content {
  /* padding-left: 50px; */
  /* padding-right: 50px; */
  height: 100%;
}

.el-tab-pane {
  height: 100%;
}

.el-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.el-tabs__content {
  flex: 1;
}

.scrollable-pane {
  max-height: 100%;
  overflow: auto;
}

.bottom-pane {
  background-color: white;
  height: 100%;
  overflow-y: auto;
}
</style>
