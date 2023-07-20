<template>
  <div>
    <list-page-top
      v-if="active"
      :breads="breads"
      :show-create="false"
      :show-refresh="true"
      :show-delete="false"
      @refresh="getTasks"
    />
    <div style="display: flex; flex-direction: row;">
      <v-card
        class="mr-2 pa-2"
        elevation="2"
        outlined
        style="width:300px;"
      >
        <v-expansion-panels
          class="mb-6"
          multiple
        >
          <v-expansion-panel>
            <v-expansion-panel-header expand-icon="mdi-menu-down">
              Search
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-text-field
                v-model="search"
                label="Search"
                outlined
                dense
                required
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel v-if="!plugin">
            <v-expansion-panel-header expand-icon="mdi-menu-down">
              Plugins
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-checkbox
                v-model="selectedAllPlugins"
                x-small
                dense
                label="Select All"
              />
              <v-divider class="pb-4" />
              <v-checkbox
                v-for="plugin in plugins"
                :key="plugin.id"
                v-model="selectedPlugins"
                :value="plugin.id"
                x-small
                dense
                :label="plugin.name"
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-header expand-icon="mdi-menu-down">
              Users
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-checkbox
                v-model="selectedAllUsers"
                x-small
                dense
                label="Select All"
              />
              <v-divider class="pb-4" />
              <v-checkbox
                v-for="user in users"
                :key="user.id"
                v-model="selectedUsers"
                :value="user.id"
                x-small
                dense
                :label="user.username"
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
      <v-card
        style="flex-grow: 1;"
        elevation="2"
        outlined
      >
        <plugin-tasks-table
          ref="pluginTaskTable"
          :plugin="plugin"
          :refresh-tasks="refreshTasks"
          :hide-columns="['id', 'task_name']"
          :selected-plugins="selectedPlugins"
          :selected-users="selectedUsers"
          :search="search"
        />
      </v-card>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import debounce from 'lodash.debounce';
import { mapState } from 'vuex';

import PluginTasksTable from '@/components/plugins/PluginTasksTable.vue';
import ListPageTop from '@/components/ListPageTop.vue';
import DownloadMixin from '@/mixins/download-stager';

export default {
  name: 'PluginTasksList',
  components: {
    PluginTasksTable,
    ListPageTop,
  },
  mixins: [DownloadMixin],
  props: {
    plugin: {
      type: Object,
      required: false,
      default: null,
    },
    refreshTasks: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      breads: [
        {
          text: 'Plugins',
          disabled: true,
          href: '/plugins',
        }, {
          text: 'Tasks',
          disabled: true,
          href: '/plugins?tab=tasks',
        },
      ],
      tasks: [],
      search: '',
      loading: false,
      moment,
      selectedPlugins: [],
      selectedUsers: [],
    };
  },
  computed: {
    ...mapState({
      plugins: (state) => state.plugin.plugins,
      users: (state) => state.user.users,
    }),
    selectedAllPlugins: {
      set(val) {
        if (val) {
          this.selectedPlugins = this.plugins.map((p) => p.id);
        } else {
          this.selectedPlugins = [];
        }
        this.debouncedGetTasks();
      },
      get() {
        return this.selectedPlugins.length === this.plugins.length;
      },
    },
    selectedAllUsers: {
      set(val) {
        if (val) {
          this.selectedUsers = this.users.map((u) => u.id);
        } else {
          this.selectedUsers = [];
        }
        this.debouncedGetTasks();
      },
      get() {
        return this.selectedUsers.length === this.users.length;
      },
    },
  },
  async mounted() {
    this.debouncedGetTasks = debounce(this.getTasks, 500);
    await Promise.all([
      this.$store.dispatch('plugin/getPlugins'),
      this.$store.dispatch('user/getUsers'),
    ]);
    this.selectedPlugins = this.plugins.map((a) => a.id);
    this.selectedUsers = this.users.map((u) => u.id);

    if (this.plugin) {
      this.selectedPlugins = [this.plugin.id];
    }
  },
  methods: {
    getTasks() {
      this.$refs.pluginTaskTable.debouncedGetTasks();
    },
  },
};
</script>

<style>
</style>
