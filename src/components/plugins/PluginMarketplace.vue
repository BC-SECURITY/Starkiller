<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="false"
      :show-delete="false"
      :show-refresh="true"
      @refresh="refreshMarketplace"
    />
    <div style="display: flex; flex-direction: row">
      <div style="width: 350px; min-width: 350px; max-width: 350px">
        <v-card elevation="2" border class="pl-4 pr-4 pb-4">
          <v-list
            :disabled="installing"
            class="overflow-y-auto"
            style="max-height: 600px"
          >
            <v-list-item
              v-for="(plugin, pluginIdx) in marketplacePlugins"
              :key="plugin.name"
              :active="selectedPluginIndex === pluginIdx"
              selectable
              @click="selectedPluginIndex = pluginIdx"
            >
              <template #prepend>
                <v-avatar>
                  <img
                    v-if="plugin.icon"
                    :src="plugin.icon"
                    alt="Plugin Icon"
                  />
                  <v-icon v-else>fa-puzzle-piece</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>{{ plugin.name }}</v-list-item-title>
              <template #append>
                <v-icon v-if="plugin.installed" color="green">
                  fa-circle-check
                </v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </div>
      <div style="flex-grow: 1">
        <v-card
          v-if="selectedPluginObj"
          elevation="2"
          border
          style="max-height: 600px"
          class="pl-4 pr-4 pb-4 overflow-y-auto"
        >
          <div style="display: flex; flex-direction: row">
            <div>
              <v-card-title>{{ selectedPluginObj.name }}</v-card-title>
              <v-card-subtitle>
                Authors:
                <author-chips :authors="selectedPluginObj.authors" />
                <v-spacer />
                <a
                  :href="selectedPluginObj.homepage_url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Homepage
                </a>
                <v-spacer />
                <a
                  :href="selectedPluginObj.source_url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source Code
                </a>
                <v-spacer />
              </v-card-subtitle>
            </div>
            <v-spacer />
            <div
              style="
                display: flex;
                flex-direction: column;
                align-items: flex-end;
              "
            >
              <v-btn
                v-if="!isSelectedInstalled"
                class="ma-4"
                color="primary"
                :loading="installing"
                @click="installSelectedPlugin"
              >
                Install
              </v-btn>
              <!-- TODO: Id should be used instead of name, but we don't have id here -->
              <router-link
                v-else
                class="text-decoration-none"
                style="color: inherit"
                :to="{
                  name: 'pluginEdit',
                  params: {
                    id: nameToId(selectedPluginObj.name),
                  },
                }"
              >
                <v-btn color="primary" class="ma-4">Go To Plugin</v-btn>
              </router-link>
              <v-select
                v-model="selectedPluginRegistry"
                style="width: 200px; max-width: 200px"
                :disabled="registryOptions.length < 2"
                label="Registry"
                :items="registryOptions"
                item-title="name"
                item-value="name"
              />
              <span v-if="isSelectedInstalled">
                <b>Installed Version:</b>
                {{ installedVersion }}
              </span>
              <v-select
                v-else
                v-model="selectedPluginVersion"
                :disabled="versionOptions.length < 2"
                label="Version"
                style="width: 200px; max-width: 200px"
                :items="versionOptions"
                item-title="name"
                item-value="name"
              />
            </div>
          </div>
          <v-divider class="mt-4 mb-4" />
          <v-card class="pa-4" elevation="2" border>
            <vue-markdown :source="selectedPluginObj.description" />
          </v-card>
          <v-divider class="mt-4 mb-4" />
        </v-card>
      </div>
    </div>
  </div>
</template>

<script>
import VueMarkdown from "vue-markdown-render";
import * as pluginApi from "@/api/plugin-api";
import AuthorChips from "@/components/AuthorChips.vue";
import ListPageTop from "@/components/ListPageTop.vue";

export default {
  name: "PluginMarketplace",
  components: {
    VueMarkdown,
    AuthorChips,
    ListPageTop,
  },
  inject: ["snack"],
  data() {
    return {
      marketplacePlugins: [],
      breads: [
        {
          title: "Plugin Marketplace",
          disabled: true,
          href: "/plugin-marketplace",
        },
      ],
      headers: [
        { title: "Name", key: "name" },
        { title: "Description", key: "description" },
      ],
      selectedPluginIndex: -1,
      selectedPluginRegistry: "",
      selectedPluginVersion: "",
      installing: false,
    };
  },
  computed: {
    selectedPluginObj() {
      if (this.selectedPluginIndex < 0) return null;
      if (this.selectedPluginRegistry === "") return null;
      return this.marketplacePlugins[this.selectedPluginIndex]?.registries[
        this.selectedPluginRegistry
      ];
    },
    isSelectedInstalled() {
      return this.marketplacePlugins[this.selectedPluginIndex]?.installed;
    },
    registryOptions() {
      return Object.keys(
        this.marketplacePlugins[this.selectedPluginIndex]?.registries,
      );
    },
    versionOptions() {
      return this.selectedPluginObj.versions;
    },
    installedVersion() {
      return this.marketplacePlugins[this.selectedPluginIndex]
        ?.installed_version;
    },
  },
  watch: {
    selectedPluginIndex() {
      if (this.selectedPluginIndex < 0) return;
      this.selectedPluginRegistry = Object.keys(
        this.marketplacePlugins[this.selectedPluginIndex]?.registries,
      )[0];
      this.selectedPluginVersion = this.selectedPluginObj.versions[0].name;
    },
  },
  async mounted() {
    try {
      await this.refreshMarketplace();
    } catch (err) {
      this.snack.error(`Failed to load plugin marketplace: ${err}`);
    }
  },
  methods: {
    async refreshMarketplace() {
      const { records } = await pluginApi.getMarketplace();
      this.marketplacePlugins = records.sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    },
    installSelectedPlugin() {
      this.installing = true;
      pluginApi
        .installPlugin({
          name: this.selectedPluginObj.name,
          version: this.selectedPluginVersion,
          registry: this.selectedPluginRegistry,
        })
        .catch((err) => {
          this.snack.error(`Error: ${err}`);
        })
        .finally(() => {
          this.installing = false;
          this.refreshMarketplace();
        });
    },
    nameToId(name) {
      return name.toLowerCase().replace(/[-/ ]/g, "_");
    },
  },
};
</script>

<style></style>
