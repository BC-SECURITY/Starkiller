<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="true"
      :show-refresh="true"
      :show-delete="showDelete"
      @create="create"
      @delete="deleteMalleableProfiles"
      @refresh="getMalleableProfiles"
    />
    <advanced-table>
      <template #filters>
        <v-expansion-panel title="Search">
          <v-expansion-panel-text>
            <v-text-field
              v-model="filter"
              append-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              label="Search"
              hide-details
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel title="Category">
          <v-expansion-panel-text>
            <v-checkbox
              v-for="cat in categories"
              :key="cat"
              v-model="selectedCategories"
              :label="cat"
              :value="cat"
              density="compact"
              hide-details
              color="primary"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </template>
      <template #table>
        <v-data-table
          v-model="selected"
          v-model:sort-by="sortBy"
          :headers="headers"
          :items="filteredProfiles"
          :items-per-page-options="[5, 10, 15, 20, 50, 100]"
          :items-per-page="15"
          item-value="id"
          density="compact"
          show-select
        >
          <template #item.name="{ item }">
            <router-link
              style="color: inherit"
              :to="{ name: 'malleableProfileEdit', params: { id: item.id } }"
            >
              {{ item.name }}
            </router-link>
          </template>
          <template #item.updated_at="{ item }">
            <date-time-display :timestamp="item.updated_at" />
          </template>
          <template #item.actions="{ item }">
            <v-menu>
              <template #activator="{ props: activatorProps }">
                <v-btn
                  variant="text"
                  icon
                  size="x-small"
                  v-bind="activatorProps"
                >
                  <v-icon>fa-ellipsis-v</v-icon>
                </v-btn>
              </template>
              <v-list class="ml-2 mr-2">
                <v-list-item key="view" link>
                  <router-link
                    class="text-decoration-none"
                    style="color: inherit"
                    :to="{
                      name: 'malleableProfileEdit',
                      params: { id: item.id },
                    }"
                  >
                    <v-list-item-title>
                      <v-icon>fa-binoculars</v-icon>
                      View
                    </v-list-item-title>
                  </router-link>
                </v-list-item>
                <v-list-item
                  key="copy"
                  :to="{
                    name: 'malleableProfileNew',
                    query: { copy: true, id: item.id },
                  }"
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
                  @click="deleteMalleableProfile(item)"
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
      </template>
    </advanced-table>
  </div>
</template>

<script>
import ListPageTop from "@/components/ListPageTop.vue";
import AdvancedTable from "@/components/tables/AdvancedTable.vue";
import DateTimeDisplay from "@/components/DateTimeDisplay.vue";
import { useMalleableProfileStore } from "@/stores/malleable-module";

export default {
  name: "MalleableProfiles",
  components: {
    DateTimeDisplay,
    ListPageTop,
    AdvancedTable,
  },
  inject: ["confirm"],
  data() {
    return {
      breads: [
        {
          title: "Malleable Profiles",
          disabled: true,
          href: "/malleable-profiles",
        },
      ],
      headers: [
        { title: "Name", key: "name" },
        { title: "Category", key: "category" },
        { title: "Updated At", key: "updated_at" },
        { title: "Actions", key: "actions", sortable: false },
      ],
      sortBy: [{ key: "name", order: "asc" }],
      filter: "",
      selected: [],
      selectedCategories: [],
    };
  },
  computed: {
    malleableProfileStore() {
      return useMalleableProfileStore();
    },
    malleableProfiles() {
      return this.malleableProfileStore.malleableProfiles;
    },
    categories() {
      const cats = new Set(
        this.malleableProfiles.map((p) => p.category).filter(Boolean),
      );
      return [...cats].sort();
    },
    filteredProfiles() {
      let profiles = this.malleableProfiles;

      if (this.filter) {
        const search = this.filter.toLowerCase();
        profiles = profiles.filter(
          (p) =>
            p.name.toLowerCase().includes(search) ||
            (p.category && p.category.toLowerCase().includes(search)),
        );
      }

      if (this.selectedCategories.length > 0) {
        profiles = profiles.filter((p) =>
          this.selectedCategories.includes(p.category),
        );
      }

      return profiles;
    },
    showDelete() {
      return this.selected.length > 0;
    },
  },
  mounted() {
    this.getMalleableProfiles();
  },
  methods: {
    getMalleableProfiles() {
      this.malleableProfileStore.getMalleableProfiles();
    },
    create() {
      this.$router.push({ name: "malleableProfileNew" });
    },
    view(item) {
      this.$router.push({
        name: "malleableProfileEdit",
        params: { id: item.id },
      });
    },
    async deleteMalleableProfile(item) {
      if (
        await this.confirm(
          "Delete",
          `Are you sure you want to delete profile ${item.name}?`,
          { color: "red" },
        )
      ) {
        await this.malleableProfileStore.deleteMalleableProfile(item.id);
      }
    },
    async deleteMalleableProfiles() {
      if (
        await this.confirm(
          "Delete",
          `Are you sure you want to delete ${this.selected.length} profiles?`,
          { color: "red" },
        )
      ) {
        this.selected.forEach((id) => {
          this.malleableProfileStore.deleteMalleableProfile(id);
        });
        this.selected = [];
      }
    },
  },
};
</script>

<style></style>
