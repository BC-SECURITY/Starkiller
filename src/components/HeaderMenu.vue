<template>
  <v-menu v-model="show" :close-on-content-click="false">
    <template #activator="{ props: activatorProps }">
      <v-btn variant="text" icon size="x-small" v-bind="activatorProps">
        <v-icon>mdi-format-columns</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-list style="overflow-y: auto" max-height="400px">
        <v-list-item>
          <v-checkbox
            v-model="selectedAll"
            color="primary"
            :label="'Select All'"
          />
        </v-list-item>
        <v-divider class="pb-4" />
        <v-list-item v-for="(item, index) in selectableHeaders" :key="index">
          <v-checkbox
            v-model="selectedHeadersTemp"
            color="primary"
            :label="item.title"
            :value="item"
          />
        </v-list-item>
      </v-list>
      <v-divider />
      <v-card-actions>
        <v-btn variant="text" color="error" @click="resetHeaders">
          Reset
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="show = false"> Cancel </v-btn>
        <v-btn variant="text" @click="submitHeaderForm"> Save </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
export default {
  name: "HeaderMenu",
  props: {
    headersFull: {
      type: Array,
      required: true,
    },
    initialSelectedHeaders: {
      type: Array,
      required: true,
    },
    defaultHeaders: {
      type: Array,
      required: true,
    },
  },
  emits: ["submit"],
  data() {
    return {
      show: false,
      selectedHeadersTemp: [],
    };
  },
  computed: {
    selectableHeaders() {
      return this.headersFull.filter((h) => !h.alwaysShow);
    },
    selectedAll: {
      set(val) {
        if (val) {
          this.selectedHeadersTemp = [...this.selectableHeaders];
        } else {
          this.selectedHeadersTemp = [];
        }
      },
      get() {
        // Membership by key, not a length comparison: with a
        // hideColumns-filtered headersFull prop (e.g. the Dashboard
        // mini-table) the selection can contain a hidden column that is
        // not a menu row, so equal lengths would not mean every visible
        // row is checked. Key matching also avoids relying on object
        // identity between the props' arrays.
        return this.selectableHeaders.every((h) =>
          this.selectedHeadersTemp.some((s) => s.key === h.key),
        );
      },
    },
  },
  watch: {
    show(val) {
      if (val) {
        this.selectedHeadersTemp = this.selectableOnly(
          this.initialSelectedHeaders,
        );
      }
    },
    initialSelectedHeaders: {
      handler(val) {
        this.selectedHeadersTemp = this.selectableOnly(val);
      },
      immediate: true,
    },
  },
  methods: {
    // alwaysShow columns are not menu options and must never be part of
    // the emitted selection — the consumers persist that selection, and a
    // persisted alwaysShow entry can defeat their empty/legacy-store
    // reseed guards (e.g. Actions' title stays truthy after a
    // deselect-all). Incoming seeds are filtered too, not just the
    // checkbox list — defense-in-depth with the consumers' mounted()
    // store cleanup, which strips alwaysShow entries persisted by older
    // builds; keep both.
    selectableOnly(headers) {
      return headers.filter((h) => !h.alwaysShow);
    },
    submitHeaderForm() {
      this.$emit("submit", [...this.selectedHeadersTemp]);
      this.show = false;
    },
    resetHeaders() {
      this.selectedHeadersTemp = this.selectableOnly(this.defaultHeaders);
      this.$emit("submit", [...this.selectedHeadersTemp]);
    },
  },
};
</script>
