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
    <v-data-table
      :headers="headers"
      :items="filteredModules"
      item-key="Name"
      show-expand
    >
      <template v-slot:item.Techniques="{ item }">
        <div class="flex flex-row flex-wrap">
          <v-chip
            v-for="tech in item.Techniques"
            :key="tech"
            small
            :href="`https://attack.mitre.org/techniques/${tech}`"
            target="_blank"
            color="green"
            class="mr-1 mb-1"
            @click.native="openExternalBrowser"
          >
            {{ tech }}
          </v-chip>
        </div>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-icon
          small
          @click.stop="execute(item)"
        >
          fa-play
        </v-icon>
      </template>
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
import openExternalBrowser from '@/mixins/open-external';

export default {
  name: 'Modules',
  mixins: [openExternalBrowser],
  data() {
    return {
      headers: [
        {
          text: 'Name',
          align: 'start',
          value: 'Name',
        },
        { text: 'Language', value: 'Language', sort: this.sortLanguage },
        { text: 'Minimum Language Version', value: 'MinLanguageVersion', sort: this.sortMinLanguageVersion },
        { text: 'Needs Admin', value: 'NeedsAdmin' },
        { text: 'Opsec Safe', value: 'OpsecSafe' },
        { text: 'Background', value: 'Background' },
        {
          text: 'Techniques', value: 'Techniques', width: '175px', sortable: false,
        },
        { text: 'Actions', value: 'actions', sortable: false },
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
        Author, Language, MinLanguageVersion, Name, Description, Techniques = [],
      }) => ({
        name: Name,
        search: `${Author} ${Language} ${MinLanguageVersion} ${Name} ${Description} ${Techniques.join(' ')}`.toLowerCase(),
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
    execute(item) {
      this.$toast.success(`hey ${item.Name}`);
      this.$router.push({ name: 'moduleExecute', query: { module: item.Name } });
    },
  },
};
</script>

<style>

</style>
