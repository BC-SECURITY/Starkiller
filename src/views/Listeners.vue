<template>
  <div class="route-container">
    <v-breadcrumbs :items="breads" />

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
    <v-data-table
      :headers="headers"
      :items="listeners"
      @click:row="viewListener"
    >
      <template v-slot:item.actions="{ item }">
        <v-icon
          small
          @click.stop="killListener(item)"
        >
          fa-trash-alt
        </v-icon>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'Listeners',
  components: {
  },
  data() {
    return {
      breads: [
        {
          text: 'Listeners',
          disabled: true,
          href: '/listeners',
        },
      ],
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
      this.$router.push({ name: 'listenerNew' });
    },
    async killListener(item) {
      try {
        await this.$confirm(`Are you sure you want to kill listener ${item.name}?`);
      } catch (err) {
        return;
      }

      this.$store.dispatch('listener/killListener', item.name);
    },
    viewListener(item) {
      this.$router.push({ name: 'listenerEdit', params: { id: item.name } });
    },
    getListeners() {
      this.$store.dispatch('listener/getListeners');
    },
  },
};
</script>

<style>
</style>
