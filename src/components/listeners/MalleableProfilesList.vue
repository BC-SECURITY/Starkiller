<template>
  <div>
    <list-page-top
      v-if="active"
      :breads="breads"
      :show-create="true"
      :show-refresh="true"
      :show-delete="showDelete"
      @create="create"
      @delete="deleteMalleableProfiles"
      @refresh="getMalleableProfiles"
    >
      <template slot="extra-stuff">
        <v-text-field
          v-model="filter"
          append-icon="mdi-magnify"
          outlined
          dense
          label="Search"
          style="max-width: 250px; padding-top: 25px"
        />
      </template>
    </list-page-top>
    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="malleableProfiles"
      :footer-props="{
        itemsPerPageOptions: [5, 10, 15, 20, 50, 100],
      }"
      :items-per-page="15"
      item-key="name"
      :search="filter"
      dense
      show-select
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
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
        <v-menu offset-y>
          <template #activator="{ on, attrs }">
            <v-btn text icon x-small v-bind="attrs" v-on="on">
              <v-icon>fa-ellipsis-v</v-icon>
            </v-btn>
          </template>
          <v-list class="ml-2 mr-2">
            <v-list-item key="view" link>
              <router-link
                class="text-decoration-none"
                style="color: inherit"
                :to="{ name: 'malleableProfileEdit', params: { id: item.id } }"
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
                params: { copy: true, id: item.id },
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
  </div>
</template>

<script>
import moment from "moment";
import ListPageTop from "@/components/ListPageTop.vue";
import DateTimeDisplay from "@/components/DateTimeDisplay.vue";
import { useMalleableProfileStore } from "@/stores/malleable-module";

export default {
  name: "MalleableProfiles",
  components: {
    DateTimeDisplay,
    ListPageTop,
  },
  props: {
    active: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      breads: [
        {
          text: "Listeners",
          disabled: true,
          href: "/listeners",
        },
        {
          text: "Malleable Profiles",
          disabled: true,
          href: "/malleable-profiles",
        },
      ],
      headers: [
        { text: "Name", value: "name" },
        { text: "Category", value: "category" },
        { text: "Updated At", value: "updated_at" },
        { text: "Actions", value: "actions", sortable: false },
      ],
      sortBy: "name",
      sortDesc: false,
      moment,
      filter: "",
      selected: [],
    };
  },
  computed: {
    malleableProfileStore() {
      return useMalleableProfileStore();
    },
    malleableProfiles() {
      return this.malleableProfileStore.malleableProfiles;
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
        await this.$root.$confirm(
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
        await this.$root.$confirm(
          "Delete",
          `Are you sure you want to delete ${this.selected.length} profiles?`,
          { color: "red" },
        )
      ) {
        this.selected.forEach((profile) => {
          this.malleableProfileStore.deleteMalleableProfile(profile.id);
        });
        this.selected = [];
      }
    },
  },
};
</script>

<style></style>
