<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="false"
      :show-refresh="false"
      :show-delete="false"
    >
      <template slot="extra-stuff">
        <v-text-field
          v-model="filter"
          append-icon="mdi-magnify"
          outlined
          dense
          label="Search"
          style="max-width: 250px; padding-top: 25px;"
        />
      </template>
    </list-page-top>
    <v-data-table
      :headers="headers"
      :items="modules"
      :footer-props="{
        itemsPerPageOptions: [5, 10, 15, 20, 50, 100],
      }"
      :items-per-page="15"
      :search="filter"
      item-key="name"
      show-expand
      dense
    >
      <template #item.name="{ item }">
        <router-link
          style="color: inherit;"
          :to="{ name: 'moduleExecute', params: { id: item.id } }"
        >
          {{ item.name }}
        </router-link>
      </template>
      <template #item.techniques="{ item }">
        <technique-chips
          :techniques="item.techniques"
          :show-title="false"
        />
      </template>
      <template #item.needs_admin="{ item }">
        <v-simple-checkbox
          v-model="item.needs_admin"
          disabled
        />
      </template>
      <template #item.opsec_safe="{ item }">
        <v-simple-checkbox
          v-model="item.opsec_safe"
          disabled
        />
      </template>
      <template #item.background="{ item }">
        <v-simple-checkbox
          v-model="item.background"
          disabled
        />
      </template>
      <template #expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <div class="d-flex flex-column">
            <b>Authors:</b>
            {{ item.authors ? item.authors.join(', ') : '' }}

            <b>Description:</b>
            {{ item.description }}

            <b>Comments:</b>
            {{ item.comments ? item.comments.join('\n ') : '' }}
          </div>
        </td>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import TechniqueChips from '@/components/TechniqueChips.vue';
import ListPageTop from '@/components/ListPageTop.vue';

export default {
  name: 'Modules',
  components: {
    TechniqueChips,
    ListPageTop,
  },
  data() {
    return {
      headers: [
        {
          text: 'Name',
          align: 'start',
          value: 'name',
        },
        { text: 'Language', value: 'language', sort: this.sortLanguage },
        { text: 'Needs Admin', value: 'needs_admin', width: '75px' },
        { text: 'Opsec Safe', value: 'opsec_safe', width: '75px' },
        { text: 'Background', value: 'background', width: '75px' },
        {
          text: 'Techniques', value: 'techniques', width: '300px', sortable: false,
        },
      ],
      filter: '',
      filteredModules: [],
      breads: [
        {
          text: 'Modules',
          disabled: true,
          href: '/modules',
        },
      ],
    };
  },
  computed: {
    ...mapState({
      modules: (state) => state.module.modules,
    }),
  },
  mounted() {
    this.$store.dispatch('module/getModules');
  },
  methods: {
    toLower(row, column, cellValue) {
      if (cellValue == null) {
        return '';
      }

      return cellValue.toLowerCase();
    },
    sortLanguage(a, b) {
      if (a == null) {
        return -1;
      } if (b == null) {
        return 1;
      }
      return a.toLowerCase().localeCompare(b.toLowerCase());
    },
    sortMinLanguageVersion(a, b) {
      if (a == null) {
        return -1;
      } if (b == null) {
        return 1;
      }
      return a.localeCompare(b, undefined, { numeric: true });
    },
  },
};
</script>

<style>

</style>
