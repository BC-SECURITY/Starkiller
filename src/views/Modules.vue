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
      item-key="Name"
      show-expand
      dense
    >
      <template #item.Name="{ item }">
        <router-link
          style="color: inherit;"
          :to="{ name: 'moduleExecute', query: { module: item.Name } }"
        >
          {{ item.Name }}
        </router-link>
      </template>
      <template #item.Techniques="{ item }">
        <technique-chips
          :techniques="item.Techniques"
          :show-title="false"
        />
      </template>
      <template #item.NeedsAdmin="{ item }">
        <v-simple-checkbox
          v-model="item.NeedsAdmin"
          disabled
        />
      </template>
      <template #item.OpsecSafe="{ item }">
        <v-simple-checkbox
          v-model="item.OpsecSafe"
          disabled
        />
      </template>
      <template #item.Background="{ item }">
        <v-simple-checkbox
          v-model="item.Background"
          disabled
        />
      </template>
      <template #expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <div class="d-flex flex-column">
            <b>Author:</b>
            {{ item.Author ? item.Author.join(', ') : '' }}

            <b>Description:</b>
            {{ item.Description }}

            <b>Comments:</b>
            {{ item.Comments ? item.Comments.join('\n ') : '' }}
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
          value: 'Name',
        },
        { text: 'Language', value: 'Language', sort: this.sortLanguage },
        { text: 'Needs Admin', value: 'NeedsAdmin' },
        { text: 'Opsec Safe', value: 'OpsecSafe' },
        { text: 'Background', value: 'Background' },
        {
          text: 'Techniques', value: 'Techniques', width: '175px', sortable: false,
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
