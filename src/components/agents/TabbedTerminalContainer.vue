<template>
  <div>
    <div class="d-flex align-center">
      <v-tabs
        v-model="activeTab"
        :height="30"
        color="primary"
        density="compact"
      >
        <v-tab
          v-for="(tab, index) in tabs"
          :key="tab.id"
          :value="tab.id"
          class="tabbed-terminal-tab"
          @contextmenu.prevent="openContextMenu($event, tab)"
        >
          <input
            v-if="renamingTabId === tab.id"
            ref="renameInput"
            v-model="renameValue"
            class="rename-input"
            @click.stop
            @keyup.enter="commitRename(tab)"
            @keyup.escape="cancelRename"
            @blur="commitRename(tab)"
          />
          <span v-else>{{ tab.name || `${label} ${index + 1}` }}</span>
          <v-btn
            v-if="tabs.length > 1"
            icon
            variant="text"
            size="x-small"
            class="ml-1 close-btn"
            @click.stop="removeTab(tab.id)"
          >
            <v-icon size="x-small">fa-times</v-icon>
          </v-btn>
        </v-tab>
      </v-tabs>
      <v-btn icon variant="text" size="x-small" class="ml-1" @click="addTab">
        <v-icon size="small">fa-plus</v-icon>
      </v-btn>
    </div>
    <v-menu
      v-model="contextMenu"
      location="bottom start"
      :target="contextMenuTarget"
    >
      <v-list density="compact">
        <v-list-item @click="startRename(contextMenuTab)">
          <template #prepend>
            <v-icon size="small">fa-pen</v-icon>
          </template>
          <v-list-item-title>Rename</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-window v-model="activeTab">
      <v-window-item
        v-for="tab in tabs"
        :key="tab.id"
        :value="tab.id"
        :transition="false"
        :reverse-transition="false"
      >
        <component :is="childComponent" :agent="agent" :tab-id="tab.id" />
      </v-window-item>
    </v-window>
  </div>
</template>

<script>
export default {
  name: "TabbedTerminalContainer",
  props: {
    agent: {
      type: Object,
      required: true,
    },
    childComponent: {
      type: Object,
      required: true,
    },
    label: {
      type: String,
      default: "Tab",
    },
    storageKey: {
      type: String,
      default: "",
    },
  },
  data() {
    const saved = this.storageKey
      ? JSON.parse(localStorage.getItem(this.storageKey) || "null")
      : null;
    return {
      tabs: saved?.tabs || [{ id: 1, name: "" }],
      activeTab: saved?.activeTab || 1,
      nextId: saved?.nextId || 2,
      renamingTabId: null,
      renameValue: "",
      contextMenu: false,
      contextMenuTab: null,
      contextMenuTarget: [0, 0],
    };
  },
  watch: {
    tabs: {
      deep: true,
      handler() {
        this.saveState();
      },
    },
    activeTab() {
      this.saveState();
    },
  },
  methods: {
    saveState() {
      if (!this.storageKey) return;
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          tabs: this.tabs,
          activeTab: this.activeTab,
          nextId: this.nextId,
        }),
      );
    },
    addTab() {
      const id = this.nextId;
      this.nextId++;
      this.tabs.push({ id, name: "" });
      this.activeTab = id;
    },
    removeTab(id) {
      const index = this.tabs.findIndex((t) => t.id === id);
      this.tabs = this.tabs.filter((t) => t.id !== id);
      if (this.activeTab === id) {
        const newIndex = Math.min(index, this.tabs.length - 1);
        this.activeTab = this.tabs[newIndex].id;
      }
    },
    openContextMenu(event, tab) {
      this.contextMenuTab = tab;
      this.contextMenuTarget = [event.clientX, event.clientY];
      this.contextMenu = true;
    },
    startRename(tab) {
      this.renamingTabId = tab.id;
      this.renameValue = tab.name;
      this.$nextTick(() => {
        const inputs = this.$refs.renameInput;
        if (inputs) {
          const input = Array.isArray(inputs) ? inputs[0] : inputs;
          input.focus();
          input.select();
        }
      });
    },
    commitRename(tab) {
      if (this.renamingTabId === null) return;
      tab.name = this.renameValue.trim();
      this.renamingTabId = null;
      this.renameValue = "";
    },
    cancelRename() {
      this.renamingTabId = null;
      this.renameValue = "";
    },
  },
};
</script>

<style lang="scss" scoped>
.tabbed-terminal-tab {
  min-width: 0;
  text-transform: none;
}

.close-btn {
  opacity: 0.6;
  &:hover {
    opacity: 1;
  }
}

.rename-input {
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 3px;
  color: inherit;
  font: inherit;
  outline: none;
  padding: 0 4px;
  max-width: 120px;
}
</style>
