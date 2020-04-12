<template>
  <div class="route-container">
    <div class="headers">
      <h3>Modules</h3>
      <el-input
        v-model="filter"
        placeholder="Search"
        style="max-width: 250px"
      />
    </div>
    <el-table
      :data="filteredModules"
      class="main-table"
      @row-click="viewModule"
    >
      <el-table-column
        prop="Name"
        label="Name"
        min-width="180"
        sortable
      />
      <el-table-column
        prop="Description"
        label="Description"
        min-width="180"
      />
      <el-table-column
        prop="Language"
        label="Language"
        :formatter="toLower"
        sortable
        :sort-method="sortLanguage"
      />
      <el-table-column
        prop="MinLanguageVersion"
        label="Min Version"
        sortable
        :sort-method="sortMinLanguageVersion"
      />
      <el-table-column
        prop="NeedsAdmin"
        label="Needs Admin"
        :formatter="cellValueRenderer"
        sortable
      />
      <el-table-column
        prop="OpsecSafe"
        label="Opsec Safe"
        :formatter="cellValueRenderer"
        sortable
      />
    </el-table>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import debounce from 'lodash.debounce';

export default {
  name: 'Modules',
  data() {
    return {
      filter: '',
      filteredModules: [],
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
        Author, Language, MinLanguageVersion, Name,
      }) => ({
        name: Name,
        search: `${Author}${Language}${MinLanguageVersion}${Name}`,
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
        .filter(el => el.search.includes(query))
        .map(el => el.name);

      this.filteredModules = this.modules.filter(el => results.indexOf(el.Name) !== -1);
    },
    viewModule() {

    },
    cellValueRenderer(row, column, cellValue) {
      // https://github.com/ElemeFE/element/issues/9977
      let value = cellValue;
      if (typeof row[column.property] === 'boolean') {
        value = String(cellValue);
      }
      return value;
    },
    toLower(row, column, cellValue) {
      if (cellValue == null) {
        return '';
      }

      return cellValue.toLowerCase();
    },
    sortLanguage(a, b) {
      if (a.Language == null) {
        return -1;
      } if (b.Language == null) {
        return 1;
      }
      return a.Language.toLowerCase().localeCompare(b.Language.toLowerCase());
    },
    sortMinLanguageVersion(a, b) {
      if (a.MinLanguageVersion == null) {
        return -1;
      } if (b.MinLanguageVersion == null) {
        return 1;
      }
      return a.MinLanguageVersion.localeCompare(b.MinLanguageVersion, undefined, { numeric: true });
    },
  },
};
</script>

<style>

</style>
