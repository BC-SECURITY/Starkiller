<template>
  <div class>
    <list-page-top
      :breads="breads"
      :show-create="true"
      :show-refresh="true"
      :refresh-loading="listenersStatus === 'loading'"
      :show-delete="showDelete"
      @create="create"
      @delete="killListeners"
      @refresh="getListeners"
    />
    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="listeners"
      :footer-props="{
        itemsPerPageOptions: [5, 10, 15, 20, 50, 100],
      }"
      :items-per-page="15"
      item-key="id"
      dense
      show-select
    >
      <template #item.enabled="{ item }">
        <v-badge
          dot
          :color="item.enabled === true ? 'green' : 'red'"
        />
      </template>
      <template #item.name="{ item }">
        <router-link
          style="color: inherit;"
          :to="{ name: 'listenerEdit', params: { id: item.id } }"
        >
          {{ item.name }}
        </router-link>
      </template>
      <template #item.created_at="{ item }">
        <v-tooltip top>
          <template #activator="{ on }">
            <span v-on="on">{{ moment(item.created_at).fromNow() }}</span>
          </template>
          <span>{{ moment(item.created_at).format('MMM D YYYY, h:mm:ss a') }}</span>
        </v-tooltip>
      </template>
      <template #item.actions="{ item }">
        <v-menu offset-y>
          <template #activator="{ on, attrs }">
            <v-btn
              text
              icon
              x-small
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>fa-ellipsis-v</v-icon>
            </v-btn>
          </template>
          <v-list class="ml-2 mr-2">
            <v-list-item
              key="view"
              link
            >
              <router-link
                class="text-decoration-none"
                style="color: inherit;"
                :to="{ name: 'listenerEdit', params: { id: item.id } }"
              >
                <v-list-item-title>
                  <v-icon>fa-binoculars</v-icon>
                  View
                </v-list-item-title>
              </router-link>
            </v-list-item>
            <v-list-item
              key="copy"
              :to="{ name: 'listenerNew', params: { copy: true, id: item.id } }"
              link
            >
              <v-list-item-title>
                <v-icon>fa-clone</v-icon>
                Copy
              </v-list-item-title>
            </v-list-item>
            <v-divider class="pb-4" />
            <v-list-item
              key="delete"
              link
              @click="killListener(item)"
            >
              <v-list-item-title>
                <v-icon>fa-trash-alt</v-icon>
                Delete
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import ListPageTop from '@/components/ListPageTop.vue';
import moment from 'moment';

export default {
  name: 'Listeners',
  components: {
    ListPageTop,
  },
  data() {
    return {
      moment,
      breads: [
        {
          text: 'Listeners',
          disabled: true,
          href: '/listeners',
        },
      ],
      headers: [
        {
          text: '', align: 'start', sortable: false, width: '5px', value: 'enabled',
        },
        { text: 'Name', value: 'name' },
        { text: 'Template', value: 'template' },
        { text: 'Host', value: 'options.Host' },
        { text: 'Port', value: 'options.Port' },
        { text: 'Created At', value: 'created_at' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      selected: [],
    };
  },
  computed: {
    ...mapState({
      listeners: (state) => state.listener.listeners,
      listenersStatus: (state) => state.listener.status,
    }),
    showDelete() {
      return this.selected.length > 0;
    },
  },
  mounted() {
    this.getListeners();
  },
  methods: {
    create() {
      this.$router.push({ name: 'listenerNew' });
    },
    async killListener(item) {
      if (await this.$root.$confirm('Delete', `Are you sure you want to kill listener ${item.name}?`, { color: 'red' })) {
        this.$store.dispatch('listener/killListener', item.id);
      }
    },
    async killListeners() {
      if (await this.$root.$confirm('Delete', `Are you sure you want to kill ${this.selected.length} listeners?`, { color: 'red' })) {
        this.selected.forEach((listener) => {
          this.$store.dispatch('listener/killListener', listener.id);
        });
        this.selected = [];
      }
    },
    getListeners() {
      this.$store.dispatch('listener/getListeners');
    },
  },
};
</script>

<style>
</style>
