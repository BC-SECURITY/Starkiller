<template>
  <div>
    <list-page-top
      v-if="active"
      :breads="breads"
      :show-create="false"
      :show-delete="false"
      :show-refresh="true"
      @refresh="getPlugins"
    />
    <v-data-table :headers="headers" :items="plugins" dense>
      <template #item.name="{ item }">
        <router-link
          style="color: inherit"
          :to="{ name: 'pluginEdit', params: { id: item.id } }"
        >
          {{ item.name }}
        </router-link>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import ListPageTop from "@/components/ListPageTop.vue";
import { usePluginStore } from "@/stores/plugin-module";

export default {
  name: "PluginsList",
  components: {
    ListPageTop,
  },
  props: {
    active: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      breads: [
        {
          text: "Plugins",
          disabled: true,
          href: "/plugins",
        },
        {
          text: "List",
          disabled: true,
          href: "/plugins?tab=list-view",
        },
      ],
      headers: [
        { text: "Name", value: "name" },
        { text: "Description", value: "description" },
      ],
    };
  },
  computed: {
    pluginStore() {
      return usePluginStore();
    },
    plugins() {
      return this.pluginStore.plugins;
    },
  },
  mounted() {
    this.getPlugins();
  },
  methods: {
    getPlugins() {
      this.pluginStore.getPlugins();
    },
  },
};
</script>

<style></style>
