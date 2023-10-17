<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="true"
      :show-refresh="true"
      :show-delete="showDelete"
      @create="create"
      @refresh="getStagers"
      @delete="deleteStagers"
    />
    <advanced-table>
      <template #filters>
        <v-switch
          v-model="filterOnlyMyStagersCheckbox"
          label="Only My Stagers"
        />
      </template>
      <template #table>
        <stagers-table
          ref="stagersTable"
          v-model="selected"
          :only-my-stagers="filterOnlyMyStagersCheckbox"
          @delete-stager="deleteStager"
        />
      </template>
    </advanced-table>
  </div>
</template>

<script>
import { mapState } from "vuex";
import moment from "moment";
import DownloadMixin from "@/mixins/download-stager";
import CopyMixin from "@/mixins/copy-stager";
import ListPageTop from "@/components/ListPageTop.vue";
import StagersTable from "@/components/stagers/StagersTable.vue";
import AdvancedTable from "@/components/tables/AdvancedTable.vue";

export default {
  name: "Stagers",
  components: {
    AdvancedTable,
    ListPageTop,
    StagersTable,
  },
  mixins: [DownloadMixin, CopyMixin],
  data() {
    return {
      moment,
      breads: [
        {
          text: "Stagers",
          disabled: true,
          href: "/stagers",
        },
      ],
      selected: [],
    };
  },
  computed: {
    ...mapState({
      filterOnlyMyStagersCheckbox: (state) =>
        state.application.filterOnlyMyStagers,
    }),
    showDelete() {
      return this.selected.length > 0;
    },
    filterOnlyMyStagersCheckbox: {
      set(val) {
        this.$store.dispatch("application/filterOnlyMyStagers", val);
      },
      get() {
        return this.filterOnlyMyStagers;
      },
    },
  },
  methods: {
    create() {
      this.$router.push({ name: "stagerNew" });
    },
    async deleteStager(item) {
      if (
        await this.$root.$confirm(
          "Delete",
          "Are you sure you want to delete this stager?",
          { color: "red" },
        )
      ) {
        this.$store.dispatch("stager/deleteStager", item.id);
      }
    },
    async deleteStagers() {
      if (
        await this.$root.$confirm(
          "Delete",
          `Are you sure you want to delete ${this.selected.length} stagers?`,
          { color: "red" },
        )
      ) {
        this.selected.forEach((stager) => {
          this.$store.dispatch("stager/deleteStager", stager.id);
        });
        this.selected = [];
      }
    },
    getStagers() {
      this.$refs.stagersTable.getStagers();
    },
  },
};
</script>

<style></style>
