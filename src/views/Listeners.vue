<template>
  <div class="route-container">
    <div class="headers">
      <h3>Listeners</h3>
      <v-btn
        color="primary"
        rounded
        @click="create"
      >
        Create Listener
      </v-btn>
    </div>
    <listener-viewer
      :visible="visible"
      :view="view"
      :view-object="viewObject"
      @close="close"
    />
    <v-data-table
      :headers="headers"
      :items="listeners"
    >
      <template v-slot:item.actions="{ item }">
        <v-icon
          small
          @click="killListener(item)"
        >
          fa-trash-alt
        </v-icon>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import ListenerViewer from '@/components/listeners/ListenerViewer.vue';

export default {
  name: 'Listeners',
  components: {
    ListenerViewer,
  },
  data() {
    return {
      headers: [
        {
          text: 'id',
          align: 'start',
          sortable: false,
          value: 'ID',
        },
        { text: 'Name', value: 'name' },
        { text: 'Module', value: 'module' },
        { text: 'Host', value: 'options.Host.Value' },
        { text: 'Port', value: 'options.Port.Value' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      visible: false,
      view: false,
      viewObject: {},
    };
  },
  computed: {
    ...mapState({
      listeners: state => state.listener.listeners,
    }),
  },
  mounted() {
    this.getListeners();
  },
  methods: {
    create() {
      this.visible = true;
    },
    close() {
      this.visible = false;
      this.view = false;
      this.viewObject = {};
      this.getListeners();
    },
    async killListener(item) {
      try {
        await this.$confirm(`Are you sure you want to kill listener ${item.name}?`);
      } catch (err) {
        return;
      }

      this.$store.dispatch('listener/killListener', item.name);
    },
    viewListener(row, column) {
      if (column.label === 'Operations') {
        return;
      }

      this.visible = true;
      this.view = true;
      this.viewObject = row;
    },
    getListeners() {
      this.$store.dispatch('listener/getListeners');
    },
  },
};
</script>

<style>

</style>
