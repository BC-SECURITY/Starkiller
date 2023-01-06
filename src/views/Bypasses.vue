<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="true"
      :show-refresh="true"
      :show-delete="showDelete"
      @create="create"
      @delete="deleteBypasses"
      @refresh="getBypasses"
    />
    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="bypasses"
      :footer-props="{
        itemsPerPageOptions: [5, 10, 15, 20, 50, 100],
      }"
      :items-per-page="15"
      item-key="name"
      dense
      show-select
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
    >
      <template #item.name="{ item }">
        <router-link
          style="color: inherit;"
          :to="{ name: 'bypassEdit', params: { id: item.id } }"
        >
          {{ item.name }}
        </router-link>
      </template>
      <template #item.updated_at="{ item }">
        <v-tooltip top>
          <template #activator="{ on }">
            <span v-on="on">{{ moment(item.updated_at).fromNow() }}</span>
          </template>
          <span>{{ moment(item.updated_at).format('MMM D YYYY, h:mm:ss a') }}</span>
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
                :to="{ name: 'bypassEdit', params: { id: item.id } }"
              >
                <v-list-item-title>
                  <v-icon>fa-binoculars</v-icon>
                  View
                </v-list-item-title>
              </router-link>
            </v-list-item>
            <v-list-item
              key="copy"
              :to="{ name: 'bypassNew', params: { copy: true, id: item.id } }"
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
              @click="deleteBypass(item)"
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
import moment from 'moment';
import ListPageTop from '@/components/ListPageTop.vue';
import { mapState } from 'vuex';

export default {
  name: 'Bypasses',
  components: {
    ListPageTop,
  },
  data() {
    return {
      breads: [
        {
          text: 'Bypasses',
          disabled: true,
          href: '/bypasses',
        },
      ],
      headers: [
        { text: 'Name', value: 'name' },
        { text: 'Updated At', value: 'updated_at' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      sortBy: 'name',
      sortDesc: false,
      moment,
      selected: [],
    };
  },
  computed: {
    ...mapState({
      bypasses: (state) => state.bypass.bypasses,
    }),
    showDelete() {
      return this.selected.length > 0;
    },
  },
  mounted() {
    this.getBypasses();
  },
  methods: {
    getBypasses() {
      this.$store.dispatch('bypass/getBypasses');
    },
    create() {
      this.$router.push({ name: 'bypassNew' });
    },
    view(item) {
      this.$router.push({ name: 'bypassEdit', params: { id: item.id } });
    },
    async deleteBypass(item) {
      if (await this.$root.$confirm('Delete', `Are you sure you want to delete bypass ${item.name}?`, { color: 'red' })) {
        this.$store.dispatch('bypass/deleteBypass', item.id);
      }
    },
    async deleteBypasses() {
      if (await this.$root.$confirm('Delete', `Are you sure you want to delete ${this.selected.length} bypasses?`, { color: 'red' })) {
        this.selected.forEach((bypass) => {
          this.$store.dispatch('bypass/deleteBypass', bypass.id);
        });
      }
    },
  },
};
</script>

<style>
</style>
