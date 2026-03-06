<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="false"
      :show-delete="false"
      :show-refresh="true"
      @refresh="getPlugins"
    />
    <v-list>
      <v-list-item
        v-for="plugin in plugins"
        :key="plugin.id"
        :to="{ name: 'pluginEdit', params: { id: plugin.id } }"
        link
      >
        <v-list-item-title>{{ plugin.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
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
  data() {
    return {
      breads: [
        {
          title: "Plugins",
          disabled: true,
          href: "/plugins",
        },
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
