<template>
  <v-menu v-model="show" offset-y :close-on-content-click="false">
    <template #activator="{ on, attrs }">
      <v-btn text icon x-small v-bind="attrs" v-on="on">
        <v-icon>mdi-format-columns</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-list style="overflow-y: auto" max-height="400px">
        <v-list-item>
          <v-checkbox v-model="selectedAll" :label="'Select All'" />
        </v-list-item>
        <v-divider class="pb-4" />
        <v-list-item v-for="(item, index) in selectableHeaders" :key="index">
          <v-checkbox
            v-model="selectedHeadersTemp"
            :label="item.text"
            :value="item"
          />
        </v-list-item>
      </v-list>
      <v-divider />
      <v-card-actions>
        <v-btn text color="error" @click="resetHeaders"> Reset </v-btn>
        <v-spacer />
        <v-btn text @click="show = false"> Cancel </v-btn>
        <v-btn text @click="submitHeaderForm"> Save </v-btn>
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
    staticHeaders() {
      return this.headersFull.filter((h) => h.alwaysShow);
    },
    selectedAll: {
      set(val) {
        if (val) {
          this.selectedHeadersTemp = [...this.headersFull];
        } else {
          this.selectedHeadersTemp = [...this.staticHeaders];
        }
      },
      get() {
        return this.selectedHeadersTemp.length === this.headersFull.length;
      },
    },
  },
  watch: {
    show(val) {
      if (val) {
        this.selectedHeadersTemp = [...this.initialSelectedHeaders];
      }
    },
    initialSelectedHeaders: {
      handler(val) {
        this.selectedHeadersTemp = [...val];
      },
      immediate: true,
    },
  },
  methods: {
    submitHeaderForm() {
      this.$emit("submit", [...this.selectedHeadersTemp]);
      this.show = false;
    },
    resetHeaders() {
      this.selectedHeadersTemp = [...this.defaultHeaders];
      this.$emit("submit", [...this.selectedHeadersTemp]);
    },
  },
};
</script>
