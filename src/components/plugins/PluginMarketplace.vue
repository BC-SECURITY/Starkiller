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
    <div style="display: flex; flex-direction: row">
      <div style="width: 350px; min-width: 350px; max-width: 350px">
        <v-card elevation="2" outlined flat class="pl-4 pr-4 pb-4">
          <v-list class="overflow-y-auto" style="max-height: 600px">
            <v-list-item-group
              v-model="selectedPluginIndex"
              mandatory
              active-class="primary--text"
            >
              <v-list-item
                v-for="plugin in marketplacePlugins"
                :key="plugin.name"
                selectable
              >
                <v-list-item-avatar>
                  <img
                    v-if="plugin.icon"
                    :src="plugin.icon"
                    alt="Plugin Icon"
                  />
                  <v-icon v-else>fa-puzzle-piece</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>{{ plugin.name }}</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                  <v-icon
                    v-if="
                      marketplacePlugins.find((p) => p.name === plugin.name)
                        .installed
                    "
                    color="green"
                  >
                    fa-circle-check
                  </v-icon>
                </v-list-item-action>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-card>
      </div>
      <div style="flex-grow: 1">
        <v-card
          v-if="selectedPluginObj"
          elevation="2"
          outlined
          flat
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
                class="pa-4 ma-4"
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
                  params: { id: selectedPluginObj.name },
                }"
              >
                <v-btn color="primary" class="pa-4 ma-4">Go To Plugin</v-btn>
              </router-link>
              <v-select
                v-model="selectedPluginRegistry"
                style="width: 200px; max-width: 200px"
                :disabled="registryOptions.length < 2"
                label="Registry"
                :items="registryOptions"
                item-text="name"
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
                item-text="name"
                item-value="name"
              />
            </div>
          </div>
          <v-divider class="mt-4 mb-4" />
          <v-card class="pa-4" outlined elevation="2">
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

export default {
  name: "PluginMarketplace",
  components: {
    VueMarkdown,
    AuthorChips,
  },
  props: {
    active: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      marketplacePlugins: [],
      breads: [
        {
          text: "Plugins",
          disabled: true,
          href: "/plugins",
        },
        {
          text: "Marketplace",
          disabled: true,
          href: "/plugins?tab=marketplace",
        },
      ],
      headers: [
        { text: "Name", value: "name" },
        { text: "Description", value: "description" },
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
    this.refreshMarketplace();
  },
  methods: {
    async refreshMarketplace() {
      this.marketplacePlugins = (await pluginApi.getMarketplace()).records;
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
          this.$snack.error(`Error: ${err}`);
        })
        .finally(() => {
          this.installing = false;
          this.refreshMarketplace();
        });
    },
  },
};
</script>

<style></style>
