<template>
  <el-drawer
    ref="drawer"
    :title="view ? `Viewing ${viewObject.name}`: 'Create New Listener'"
    direction="btt"
    size="95%"
    :visible="visible"
    :before-close="done"
    :destroy-on-close="true"
  >
    <!-- This is super hacky. For some reason the scrollable-pane is not working  -->
    <!-- unless content is wrapped in the split panel... -->
    <split-pane
      :min-percent="20"
      :default-percent="100"
      split="horizontal"
    >
      <template slot="paneL">
        <div class="content">
          <el-tabs>
            <el-tab-pane label="View">
              <div class="scrollable-pane">
                <listener-form
                  :view="view"
                  :view-object="viewObject"
                  @done="formDone"
                />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </template>
      <template slot="paneR">
        <div
          ref="bottomScrollable"
          class="bottom-pane"
        >
          <span>filler</span>
        </div>
      </template>
    </split-pane>
  </el-drawer>
</template>

<script>
import ListenerForm from '@/components/listeners/ListenerForm.vue';
import SplitPane from 'vue-splitpane';

export default {
  components: {
    ListenerForm,
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
     * Indicates whether we are creating or viewing a listener.
     */
    view: {
      type: Boolean,
      default: false,
    },
    /**
     * If we are viewing a listener, this is the object to populate the fields with.
     */
    viewObject: {
      type: Object,
      default: () => {},
    },
  },
  methods: {
    done(done) {
      this.$emit('close');
      done();
    },
    formDone() {
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
