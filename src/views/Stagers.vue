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
          v-model="applicationStore.filterOnlyMyStagers"
          label="Only My Stagers"
        />
      </template>
      <template #table>
        <stagers-table
          ref="stagersTable"
          v-model="selected"
          :only-my-stagers="applicationStore.filterOnlyMyStagers"
          @delete-stager="deleteStager"
        />
      </template>
    </advanced-table>
  </div>
</template>

<script>
import moment from "moment";
import DownloadMixin from "@/mixins/download-stager";
import CopyMixin from "@/mixins/copy-stager";
import ListPageTop from "@/components/ListPageTop.vue";
import StagersTable from "@/components/stagers/StagersTable.vue";
import AdvancedTable from "@/components/tables/AdvancedTable.vue";
import { useStagerStore } from "@/stores/stager-module";
import { useApplicationStore } from "@/stores/application-module";
import app from "@/App.vue";

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
    app() {
      return app;
    },
    stagerStore() {
      return useStagerStore();
    },
    applicationStore() {
      return useApplicationStore();
    },
    showDelete() {
      return this.selected.length > 0;
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
        await this.stagerStore.deleteStager(item.id);
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
          this.stagerStore.deleteStager(stager.id);
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
