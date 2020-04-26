<template>
  <div>
    <v-breadcrumbs :items="breads" />
    <div class="headers">
      <h3>Modules</h3>
      <v-text-field
        v-model="filter"
        outlined
        dense
        label="Search"
        style="max-width: 250px"
      />
    </div>
    <!-- TODO if we refactor the way we fetch modules we can add a loading state to the table. -->
    <v-data-table
      :headers="headers"
      :items="filteredModules"
      item-key="Name"
      show-expand
    >
      <template v-slot:expanded-item="{ headers, item }">
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
import debounce from 'lodash.debounce';

export default {
  name: 'Modules',
  data() {
    return {
      headers: [
        {
          text: 'Name',
          align: 'start',
          value: 'Name',
        },
        { text: 'Language', value: 'Language', sort: this.sortLanguage },
        { text: 'MinLanguageVersion', value: 'MinLanguageVersion', sort: this.sortMinLanguageVersion },
        { text: 'Needs Admin', value: 'NeedsAdmin' },
        { text: 'OpsecSafe', value: 'OpsecSafe' },
        { text: 'Background', value: 'Background' },
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
      modules: state => state.module.modules,
    }),
    /**
     * An array containing the name of the module and a searchable string for filtering.
     * The search function will filter this array down
     * then match the namesback to to the original array.
     */
    moduleSearch() {
      return this.modules.map(({
        Author, Language, MinLanguageVersion, Name, Description,
      }) => ({
        name: Name,
        search: `${Author} ${Language} ${MinLanguageVersion} ${Name} ${Description}`.toLowerCase(),
      }));
    },
  },
  watch: {
    filter(val) {
      this.debouncedDoFilter(val);
    },
    modules() {
      // get the filteredModules array filled initially, once the
      // modules from vuex are loaded
      if (this.filteredModules.length === 0) {
        this.debouncedDoFilter('');
      }
    },
  },
  mounted() {
    // get modules
    this.$store.dispatch('module/getModules');
    // set up debounce
    this.debouncedDoFilter = debounce(this.doFilter, 300);
  },
  methods: {
    doFilter(query) {
      const results = this.moduleSearch
        .filter(el => el.search.includes(query.toLowerCase()))
        .map(el => el.name);

      this.filteredModules = this.modules.filter(el => results.indexOf(el.Name) !== -1);
    },
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
