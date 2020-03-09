<template>
  <div class="route-container">
    <div class="headers">
      <h3>Listeners</h3>
      <el-button
        type="primary"
        round
        @click="create"
      >
        Create Listener
      </el-button>
    </div>
    <listener-viewer
      :visible="visible"
      :view="view"
      :view-object="viewObject"
      @close="close"
    />
    <el-table
      :data="listeners"
      class="main-table"
      @row-click="viewListener"
    >
      <el-table-column
        prop="ID"
        label="id"
        sortable
      />
      <el-table-column
        prop="name"
        label="Name"
        sortable
      />
      <el-table-column
        prop="module"
        label="Module"
        sortable
      />
      <el-table-column
        prop="options.Host.Value"
        label="Host"
        sortable
      />
      <el-table-column
        prop="options.Port.Value"
        label="Port"
        sortable
      />
      <el-table-column
        fixed="right"
        label="Operations"
        width="120"
      >
        <template slot-scope="scope">
          <el-button
            type="danger"
            icon="el-icon-delete"
            label="Kill"
            circle
            size="small"
            @click="killListener(scope.$index, listeners)"
          />
        </template>
      </el-table-column>
    </el-table>
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
    async killListener(index, rows) {
      try {
        await this.$confirm(`Are you sure you want to kill listener ${rows[index].name}?`);
      } catch (err) {
        return;
      }

      this.$store.dispatch('listener/killListener', rows[index].name);
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
