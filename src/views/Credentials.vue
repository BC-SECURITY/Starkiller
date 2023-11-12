<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="true"
      :show-refresh="true"
      :show-delete="showDelete"
      @create="create"
      @delete="deleteCredentials"
      @refresh="getCredentials"
    />
    <div style="display: flex; flex-direction: row; flex-wrap: wrap">
      <v-card
        class="mr-2 pa-2"
        elevation="2"
        outlined
        style="flex-basis: 250px"
      >
        <v-expansion-panels class="mb-6" multiple>
          <expansion-panel-search
            v-model="search"
            title="Search"
            label="Search"
          />
          <expansion-panel-filter
            v-model="selectedTags"
            title="Tags"
            label="label"
            item-key="id"
            item-value="label"
            :items="tags"
            :empty-default="true"
          />
        </v-expansion-panels>
      </v-card>
      <v-card style="flex: 1; min-width: 0" elevation="2" outlined>
        <v-data-table
          v-model="selected"
          :loading="loading"
          :headers="headers"
          :items="credentials"
          item-key="id"
          dense
          show-select
        >
          <template #item.id="{ item }">
            <router-link
              style="color: inherit"
              :to="{ name: 'credentialEdit', params: { id: item.id } }"
            >
              {{ item.id }}
            </router-link>
          </template>
          <template #item.username="{ item }">
            <div class="point" @click="copyToClipboard(item.username)">
              {{ item.username }}
              <i class="fa fa-paperclip center-icon" />
            </div>
          </template>
          <template #item.password="{ item }">
            <div class="point" @click="copyToClipboard(item.password)">
              {{ item.password }}
              <i class="fa fa-paperclip center-icon" />
            </div>
          </template>
          <template #item.tags="{ item }">
            <tag-viewer
              :tags="item.tags"
              @update-tag="updateTag(item, ...arguments)"
              @delete-tag="deleteTag(item, ...arguments)"
              @new-tag="addTag(item, ...arguments)"
            />
          </template>
          <template #item.actions="{ item }">
            <v-menu offset-y>
              <template #activator="{ on, attrs }">
                <v-btn text icon x-small v-bind="attrs" v-on="on">
                  <v-icon>fa-ellipsis-v</v-icon>
                </v-btn>
              </template>
              <v-list class="ml-2 mr-2">
                <v-list-item key="edit" link>
                  <router-link
                    class="text-decoration-none"
                    style="color: inherit"
                    :to="{ name: 'credentialEdit', params: { id: item.id } }"
                  >
                    <v-list-item-title>
                      <v-icon>fa-pencil-alt</v-icon>
                      Edit
                    </v-list-item-title>
                  </router-link>
                </v-list-item>
                <v-list-item key="copy" link>
                  <router-link
                    class="text-decoration-none"
                    style="color: inherit"
                    :to="{
                      name: 'credentialNew',
                      params: { copy: true, id: item.id },
                    }"
                  >
                    <v-list-item-title>
                      <v-icon>fa-clone</v-icon>
                      Copy
                    </v-list-item-title>
                  </router-link>
                </v-list-item>
                <v-divider class="pb-4" />
                <v-list-item key="delete" link @click="deleteCredential(item)">
                  <v-list-item-title>
                    <v-icon>fa-trash-alt</v-icon>
                    Delete
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-data-table>
      </v-card>
    </div>
  </div>
</template>

<script>
import debounce from "lodash.debounce";
import ListPageTop from "@/components/ListPageTop.vue";
import TagViewer from "@/components/TagViewer.vue";
import ExpansionPanelSearch from "@/components/tables/ExpansionPanelSearch.vue";
import ExpansionPanelFilter from "@/components/tables/ExpansionPanelFilter.vue";
import * as tagApi from "@/api/tag-api";
import * as credentialApi from "@/api/credential-api";
import { useCredentialStore } from "@/stores/credential-module";

export default {
  name: "Credentials",
  components: {
    ExpansionPanelFilter,
    ExpansionPanelSearch,
    TagViewer,
    ListPageTop,
  },
  data() {
    return {
      breads: [
        {
          text: "Credentials",
          disabled: true,
          href: "/credentials",
        },
      ],
      headers: [
        { text: "id", value: "id" },
        { text: "CredType", value: "credtype" },
        { text: "Username", value: "username" },
        { text: "Password", value: "password" },
        { text: "Domain", value: "domain" },
        { text: "Host", value: "host" },
        { text: "Tags", value: "tags", width: 300 },
        { text: "Actions", value: "actions", sortable: false },
      ],
      selected: [],
      selectedTags: [],
      tags: [],
      search: "",
      credentials: [],
      debouncedGetCredentials: debounce(this.getCredentials, 500),
      loading: false,
    };
  },
  computed: {
    credentialStore() {
      return useCredentialStore();
    },
    showDelete() {
      return this.selected.length > 0;
    },
  },
  watch: {
    search() {
      this.debouncedGetCredentials();
    },
    selectedTags() {
      this.debouncedGetCredentials();
    },
  },
  mounted() {
    this.getCredentials();
    this.getTags();
  },
  methods: {
    async getTags() {
      const tags = await tagApi.getTags({
        page: 1,
        limit: -1,
        sources: "credential",
      });

      const dedupedTags = [];
      tags.records.forEach((tag) => {
        const existingTag = dedupedTags.find(
          (t) => t.name === tag.name && t.value === tag.value,
        );
        if (!existingTag) {
          dedupedTags.push(tag);
        }
      });

      this.tags = dedupedTags;
    },
    deleteTag(credential, tag) {
      credentialApi
        .deleteTag(credential.id, tag.id)
        .then(() => {
          credential.tags = credential.tags.filter((t) => t.id !== tag.id);
          this.getTags();
        })
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    updateTag(credential, tag) {
      credentialApi
        .updateTag(credential.id, tag)
        .then((t) => {
          const index = credential.tags.findIndex((x) => x.id === t.id);
          credential.tags.splice(index, 1, t);
          this.getTags();
          this.$snack.success("Tag updated");
        })
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    addTag(credential, tag) {
      credentialApi
        .addTag(credential.id, tag)
        .then((t) => {
          credential.tags.push(t);
          this.getTags();
        })
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    async getCredentials() {
      this.loading = true;

      try {
        this.credentials = await credentialApi.getCredentials({
          search: this.search,
          tags: this.selectedTags,
        });
      } finally {
        this.loading = false;
      }
    },
    create() {
      this.$router.push({ name: "credentialNew" });
    },
    async deleteCredential(item) {
      if (
        await this.$root.$confirm(
          "Delete",
          `Are you sure you want to delete credential ${item.id}?`,
          { color: "red" },
        )
      ) {
        await this.credentialStore.deleteCredential(item.id);
        this.debouncedGetCredentials();
      }
    },
    async deleteCredentials() {
      if (
        await this.$root.$confirm(
          "Delete",
          `Are you sure you want to delete ${this.selected.length} credentials?`,
          { color: "red" },
        )
      ) {
        this.selected.map(async (credential) => {
          await this.credentialStore.deleteCredential(credential.id);
        });
        this.debouncedGetCredentials();
      }
    },
    async copyToClipboard(val) {
      try {
        await navigator.clipboard.writeText(val);
        this.$snack.success("Output copied to clipboard");
      } catch (error) {
        this.$snack.warn(
          "Failed to copy to clipboard. You must be on HTTPS or localhost.",
        );
      }
    },
  },
};
</script>

<style>
.point:hover {
  cursor: pointer;
}
</style>
