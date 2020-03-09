<template>
  <el-drawer
    ref="drawer"
    :title="`Viewing ${viewObject.name}`"
    direction="btt"
    size="95%"
    :visible="visible"
    :before-close="done"
    :destroy-on-close="true"
  >
    <split-pane
      :min-percent="20"
      :default-percent="60"
      split="horizontal"
    >
      <template slot="paneL">
        <div class="content">
          <el-tabs
            v-model="activeTab"
            tab-position="top"
            :before-leave="tabClick"
          >
            <el-tab-pane
              label="View"
              name="view"
            >
              <div class="scrollable-pane">
                <agent-form
                  :view="view"
                  :view-object="viewObject"
                  @done="done"
                />
              </div>
            </el-tab-pane>
            <el-tab-pane
              v-if="view"
              label="Interact"
              name="interact"
            >
              <div class="scrollable-pane">
                <agent-interact
                  :view-object="viewObject"
                />
              </div>
            </el-tab-pane>
            <el-tab-pane
              label="Execute Module"
              name="execute"
            >
              <div class="scrollable-pane">
                <agent-execute-module
                  :agent-name="viewObject.name"
                />
              </div>
            </el-tab-pane>
            <el-tab-pane
              label="Clear Queued Tasks"
              name="clear"
            />
            <el-tab-pane
              label="Kill Agent"
              name="kill"
            />
            <el-tab-pane
              label="Remove Agent"
              name="remove"
            />
          </el-tabs>
        </div>
      </template>
      <template slot="paneR">
        <div
          ref="bottomScrollable"
          class="bottom-pane"
        >
          <agent-command-viewer
            :view-object="viewObject"
            @new-results="scrollResults"
          />
        </div>
      </template>
    </split-pane>
  </el-drawer>
</template>

<script>
import AgentForm from '@/components/agents/AgentForm.vue';
import AgentInteract from '@/components/agents/AgentInteract.vue';
import AgentExecuteModule from '@/components/agents/AgentExecuteModule.vue';
import AgentCommandViewer from '@/components/agents/AgentCommandViewer.vue';
import SplitPane from 'vue-splitpane';

export default {
  components: {
    AgentForm,
    AgentInteract,
    AgentExecuteModule,
    AgentCommandViewer,
    SplitPane,
  },
  props: {
    /**
     * True if the drawer should be open, false if not.
     */
    visible: {
      type: Boolean,
      default: false,
    },
    /**
     * Indicates whether we are creating or viewing an Agent.
     */
    view: {
      type: Boolean,
      default: false,
    },
    /**
     * If we are viewing an Agent, this is the object to populate the fields with.
     */
    viewObject: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      activeTab: 'view',
    };
  },
  watch: {
    visible() {
      if (this.visible === true) {
        this.activeTab = 'view';
      }
    },
  },
  methods: {
    /**
     * When new results appear in the AgentCommandViewer, scroll it down to the bottom.
     */
    scrollResults() {
      this.$refs.bottomScrollable.scrollTop = this.$refs.bottomScrollable.scrollHeight;
    },
    done(done) {
      this.$emit('close');
      done();
    },
    // eslint-disable-next-line no-unused-vars
    tabClick(newTab, oldTab) {
      if (newTab === 'kill') {
        this.killAgent();
        return false;
      }
      if (newTab === 'clear') {
        this.clearQueue();
        return false;
      }
      if (newTab === 'remove') {
        this.removeAgent();
        return false;
      }

      return true;
    },
    async clearQueue() {
      try {
        await this.$confirm('Do you want to clear queue?');
      } catch (err) {
        return;
      }

      this.$store.dispatch('agent/clearQueue', { name: this.viewObject.name });
      this.$notify({
        message: `Clearing queued tasks for Agent ${this.viewObject.name}.`,
        type: 'success',
      });
    },
    async killAgent() {
      try {
        await this.$confirm(`Do you want to kill ${this.viewObject.name}?`);
      } catch (err) {
        return;
      }

      this.$store.dispatch('agent/killAgent', { name: this.viewObject.name });
      this.$notify({
        message: `Agent ${this.viewObject.name} tasked to run TASK_EXIT.`,
        type: 'success',
      });
      this.$refs.drawer.closeDrawer();
    },
    async removeAgent() {
      try {
        await this.$confirm(`Do you want to remove ${this.viewObject.name}? \n\nWARNING: doesn't kill the agent first! Ensure the agent is dead.`);
      } catch (err) {
        return;
      }

      this.$store.dispatch('agent/removeAgent', { name: this.viewObject.name });
      this.$notify({
        message: `Agent ${this.viewObject.name} removed.`,
        type: 'success',
      });
      this.$refs.drawer.closeDrawer();
    },
  },
};
</script>

<style lang="scss" scoped>
.content {
  padding-left: 50px;
  padding-right: 50px;
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
