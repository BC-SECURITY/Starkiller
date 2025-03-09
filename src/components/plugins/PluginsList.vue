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
      <v-list-item-group v-model="activeThing">
        <router-link
          v-for="plugin in plugins"
          :key="plugin.id"
          style="color: inherit; text-decoration: none"
          :to="{ name: 'pluginEdit', params: { id: plugin.id } }"
        >
          <v-list-item class="list-item">
            <v-list-item-content>
              <v-list-item-title>{{ plugin.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </router-link>
      </v-list-item-group>
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
      activeThing: null,
      breads: [
        {
          text: "Plugins",
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
