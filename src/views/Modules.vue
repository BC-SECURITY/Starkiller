<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="false"
      :show-refresh="false"
      :show-delete="false"
    />
    <advanced-table>
      <template #filters>
        <v-switch v-model="showIds" label="Show IDs" />
        <expansion-panel-search
          v-model="search"
          title="Search"
          label="Search"
        />
        <expansion-panel-boolean v-model="needsAdmin" title="Needs Admin" />
        <expansion-panel-boolean v-model="opsecSafe" title="Opsec Safe" />
        <expansion-panel-boolean v-model="background" title="Background" />
        <expansion-panel-filter
          v-model="languages"
          title="Language"
          label="label"
          item-key="value"
          item-value="value"
          :items="languageOptions"
        />
      </template>
      <template #table>
        <modules-table
          :search="search"
          :show-ids="showIds"
          :needs-admin="needsAdmin"
          :opsec-safe="opsecSafe"
          :background="background"
          :selected-languages="languages"
          @languages-changed="languagesChanged"
        />
      </template>
    </advanced-table>
  </div>
</template>

<script>
import ListPageTop from "@/components/ListPageTop.vue";
import ModulesTable from "@/components/modules/ModulesTable.vue";
import AdvancedTable from "@/components/tables/AdvancedTable.vue";
import ExpansionPanelFilter from "@/components/tables/ExpansionPanelFilter.vue";
import ExpansionPanelBoolean from "@/components/tables/ExpansionPanelBoolean.vue";
import ExpansionPanelSearch from "@/components/tables/ExpansionPanelSearch.vue";

export default {
  name: "Modules",
  components: {
    ExpansionPanelSearch,
    ExpansionPanelBoolean,
    ExpansionPanelFilter,
    AdvancedTable,
    ModulesTable,
    ListPageTop,
  },
  data() {
    return {
      search: "",
      breads: [
        {
          text: "Modules",
          disabled: true,
          href: "/modules",
        },
      ],
      showIds: false,
      needsAdmin: [],
      opsecSafe: [],
      background: [],
      languages: [],
      languageOptions: [],
    };
  },
  methods: {
    languagesChanged(val) {
      this.languageOptions = val.map((language) => ({
        label: language,
        value: language,
      }));
    },
  },
};
</script>

<style></style>
