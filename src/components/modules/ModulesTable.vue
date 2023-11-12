<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="filteredModules"
      :footer-props="{
        itemsPerPageOptions: [5, 10, 15, 20, 50, 100],
      }"
      :items-per-page="15"
      item-key="id"
      show-expand
      dense
    >
      <template #item.id="{ item }">
        <router-link
          style="color: inherit"
          :to="{ name: 'moduleExecute', params: { id: item.id } }"
        >
          {{ item.id }}
        </router-link>
      </template>
      <template #item.name="{ item }">
        <router-link
          style="color: inherit"
          :to="{ name: 'moduleExecute', params: { id: item.id } }"
        >
          {{ item.name }}
        </router-link>
      </template>
      <template #item.techniques="{ item }">
        <technique-chips :techniques="item.techniques" :show-title="false" />
      </template>
      <template #item.needs_admin="{ item }">
        <v-simple-checkbox v-model="item.needs_admin" disabled />
      </template>
      <template #item.opsec_safe="{ item }">
        <v-simple-checkbox v-model="item.opsec_safe" disabled />
      </template>
      <template #item.background="{ item }">
        <v-simple-checkbox v-model="item.background" disabled />
      </template>
      <template #expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <div class="d-flex flex-column">
            <b>Description:</b>
            {{ item.description }}
          </div>
        </td>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import TechniqueChips from "@/components/TechniqueChips.vue";
import { useModuleStore } from "@/stores/module-module";

export default {
  name: "ModulesTable",
  components: {
    TechniqueChips,
  },
  props: {
    showIds: {
      type: Boolean,
      default: false,
    },
    search: {
      type: String,
      default: "",
    },
    needsAdmin: {
      type: Array,
      default: () => [],
    },
    opsecSafe: {
      type: Array,
      default: () => [],
    },
    background: {
      type: Array,
      default: () => [],
    },
    selectedLanguages: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {};
  },
  computed: {
    moduleStore() {
      return useModuleStore();
    },
    modules() {
      return this.moduleStore.modules;
    },
    languagesUnique() {
      return [
        ...new Set(this.modules.map((mod) => mod.language.toLowerCase())),
      ];
    },
    headers() {
      const headers = [
        {
          text: "Name",
          value: "name",
        },
        { text: "Language", value: "language", sort: this.sortLanguage },
        { text: "Needs Admin", value: "needs_admin", width: "75px" },
        { text: "Opsec Safe", value: "opsec_safe", width: "75px" },
        { text: "Background", value: "background", width: "75px" },
        {
          text: "Techniques",
          value: "techniques",
          width: "300px",
          sortable: false,
        },
      ];
      if (this.showIds) {
        headers.unshift({
          text: "id",
          align: "start",
          value: "id",
        });
      }

      return headers;
    },
    filteredModules() {
      let mods = this.modules;

      if (this.search) {
        mods = mods.filter((mod) => {
          const search = this.search.toLowerCase();
          return (
            mod.name.toLowerCase().includes(search) ||
            mod.id.toLowerCase().includes(search) ||
            mod.language.toLowerCase().includes(search) ||
            mod.description.toLowerCase().includes(search)
          );
        });
      }

      mods = mods
        .filter((mod) => this.needsAdmin.includes(mod.needs_admin))
        .filter((mod) => this.opsecSafe.includes(mod.opsec_safe))
        .filter((mod) => this.background.includes(mod.background))
        .filter((mod) =>
          this.selectedLanguages.includes(mod.language.toLowerCase()),
        );

      return mods;
    },
  },
  watch: {
    languagesUnique(val) {
      this.$emit("languages-changed", val);
    },
  },
  mounted() {
    this.moduleStore.getModules();
  },
  methods: {
    sortLanguage(a, b) {
      if (a == null) {
        return -1;
      }
      if (b == null) {
        return 1;
      }
      return a.toLowerCase().localeCompare(b.toLowerCase());
    },
  },
};
</script>

<style></style>
