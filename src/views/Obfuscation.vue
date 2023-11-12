<template>
  <div class="mr-6">
    <list-page-top
      :breads="breads"
      :show-create="false"
      :show-refresh="true"
      :show-delete="false"
      @refresh="refresh"
    />
    <v-dialog v-model="keywordDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ keywordDialogTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-form
              ref="form"
              v-model="valid"
              @submit.prevent.native="saveKeyword"
            >
              <v-text-field
                v-model="editedKeyword.keyword"
                :rules="rules['keyword']"
                dense
                outlined
                required
                label="Keyword"
              />
              <v-text-field
                v-model="editedKeyword.replacement"
                :rules="rules['replacement']"
                dense
                outlined
                required
                label="Replacement"
              />
              <v-btn @click="generateRandom"> Random </v-btn>
            </v-form>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="blue darken-1" text @click="keywordDialog = false">
            Cancel
          </v-btn>
          <v-btn color="blue darken-1" text @click="saveKeyword"> Save </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="preobfuscateDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5" />
        </v-card-title>
        <v-card-text>
          <p>
            Are you sure? This will preobfuscate every module and will take a
            few minutes. Check "reobfuscate" if you need to force all modules to
            be reobfuscated after changing the global obfuscation configuration.
          </p>
          <v-container>
            <v-checkbox v-model="reobfuscate" label="Reobfuscate" />
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="blue darken-1" text @click="preobfuscateDialog = false">
            Cancel
          </v-btn>
          <v-btn color="blue darken-1" text @click="preobfuscateModules">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <div style="display: flex; flex-direction: row; align-items: flex-start">
      <v-card style="flex: 1 0 50%" class="ma-2 pa-2">
        <v-card-title>
          <span
            style="display: flex; justify-content: space-between; width: 100%"
          >
            <span class="headline">Keyword Obfuscation</span>
            <v-btn color="primary" @click="createKeyword">
              Create
              <v-icon right> fa-plus-square </v-icon>
            </v-btn>
          </span>
        </v-card-title>
        <v-data-table :headers="headers" :items="keywords">
          <template #item.actions="{ item }">
            <v-menu offset-y>
              <template #activator="{ on, attrs }">
                <v-btn text icon x-small v-bind="attrs" v-on="on">
                  <v-icon>fa-ellipsis-v</v-icon>
                </v-btn>
              </template>
              <v-list class="ml-2 mr-2">
                <v-divider class="pb-4" />
                <v-list-item key="edit" link @click="editKeyword(item)">
                  <v-list-item-title>
                    <v-icon>fa-edit</v-icon>
                    Edit
                  </v-list-item-title>
                </v-list-item>
                <v-list-item key="delete" link @click="deleteKeyword(item)">
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
      <v-card style="flex: 1 0 50%" class="ma-2 pa-2">
        <v-card-title>
          <span>
            <span class="headline">Global Obfuscation</span>
          </span>
        </v-card-title>
        <v-card-text>
          <v-card
            v-for="(config, index) in configs"
            :key="index"
            outlined
            class="ma-2 pa-2"
          >
            <v-card-subtitle>{{ config.language }}</v-card-subtitle>
            <v-card-text>
              <v-form>
                <v-switch
                  v-model="config.enabled"
                  label="Enabled"
                  :readonly="readonly"
                />
                <v-text-field
                  v-model="config.command"
                  label="Command"
                  :rules="
                    config.language !== 'csharp'
                      ? [(v) => !!v || 'Command is required']
                      : []
                  "
                  dense
                  outlined
                  :readonly="readonly"
                />
                <!-- This isn't currently used. Showing it would probably just confuse people. -->
                <!-- <v-text-field
                  v-model="configs[0].module"
                  label="ModuleName"
                  :rules="[v => !!v || 'ModuleName is required']"
                  dense
                  outlined
                  :readonly="true"
                /> -->
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" @click="editConfig(config)"> Save </v-btn>
              <v-btn
                :disabled="!config.preobfuscatable"
                text
                color="primary"
                @click="openPreobfuscateDialog(config)"
              >
                Preobfuscate
              </v-btn>
              <v-btn
                :disabled="!config.preobfuscatable"
                text
                color="error"
                @click="deletePreobfuscatedModules(config)"
              >
                Remove preobfuscated modules
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import * as obfuscationApi from "@/api/obfuscation-api";
import ListPageTop from "@/components/ListPageTop.vue";
import { useObfuscationStore } from "@/stores/obfuscation-module";
import { mapState } from "pinia";

export default {
  components: {
    ListPageTop,
  },
  data() {
    return {
      valid: true,
      keywordDialog: false,
      keywordDialogTitle: "",
      editedKeyword: {},
      preobfuscateDialog: false,
      editedPreobfuscate: {},
      reobfuscate: false,
      breads: [
        {
          text: "Obfuscation",
          disabled: true,
          href: "/obfuscation",
        },
      ],
      command: "",
      readonly: false,
      headers: [
        {
          text: "Keyword",
          value: "keyword",
        },
        {
          text: "Replacement",
          value: "replacement",
        },
        {
          text: "Actions",
          value: "actions",
          sortable: false,
          width: 15,
        },
      ],
      rules: {
        keyword: [
          (v) => !!v || "Keyword is required",
          (v) => v.length >= 3 || "Keyword must be at least 3 characters",
        ],
        replacement: [
          (v) => !!v || "Replacement is required",
          (v) => v.length >= 3 || "Replacement must be at least 3 characters",
        ],
      },
    };
  },
  computed: {
    obfuscationStore() {
      return useObfuscationStore();
    },
    ...mapState(useObfuscationStore, ["keywords", "configs"]),
  },
  mounted() {
    this.refresh();
  },
  methods: {
    refresh() {
      this.refreshKeywords();
      this.refreshConfigs();
    },
    refreshKeywords() {
      this.obfuscationStore.getKeywords();
    },
    refreshConfigs() {
      this.obfuscationStore.getConfigs();
    },
    toggleEditing(item) {
      console.log("editing");
      this.$set(item, "editing", !item.editing);
    },
    editKeyword(item) {
      this.editedKeyword = { ...item };
      this.keywordDialogTitle = "Edit Keyword";
      this.keywordDialog = true;
    },
    createKeyword() {
      this.editedKeyword = {
        keyword: "",
        replacement: "",
      };
      this.keywordDialogTitle = "New Keyword";
      this.keywordDialog = true;
    },
    generateRandom() {
      this.editedKeyword.replacement = Math.random()
        .toString(36)
        .substring(2, 8);
    },
    async saveKeyword() {
      if (!this.$refs.form.validate()) {
        return;
      }
      try {
        if (!this.editedKeyword.id) {
          await obfuscationApi.createKeyword(this.editedKeyword);
        } else {
          await obfuscationApi.updateKeyword(this.editedKeyword);
        }
        this.refreshKeywords();
        this.keywordDialog = false;
      } catch (e) {
        this.$snack.error(`${e}`);
      }
    },
    async deleteKeyword(item) {
      if (
        await this.$root.$confirm(
          "Delete",
          `Are you sure you want to delete keyword ${item.keyword}?`,
          { color: "red" },
        )
      ) {
        await this.obfuscationStore.deleteKeyword(item.id);
      }
    },
    async editConfig(config) {
      try {
        await obfuscationApi.updateObfuscationConfig(config);
        if (config.preobfuscatable) {
          this.$snack.success(
            'Updated config. Use "preobfuscate" to re-apply obfuscation.',
          );
        } else {
          this.$snack.success("Updated config.");
        }
      } catch (e) {
        this.$snack.error(`${e}`);
      }
    },
    openPreobfuscateDialog(config) {
      this.editedPreobfuscate = {
        ...config,
      };
      this.reobfuscate = false;
      this.preobfuscateDialog = true;
    },
    async preobfuscateModules() {
      try {
        // save the current state of the config first
        await obfuscationApi.updateObfuscationConfig(this.editedPreobfuscate);
        await obfuscationApi.preobfuscateModules(
          this.editedPreobfuscate.language,
          this.reobfuscate,
        );
        this.$snack.info(
          "Preobfuscation started in the background. This will take a few minutes.",
        );
      } catch (e) {
        this.$snack.error(`${e}`);
      }
      this.preobfuscateDialog = false;
    },
    async deletePreobfuscatedModules(config) {
      if (
        await this.$root.$confirm(
          "",
          "Are you sure? This will delete all preobfuscated modules.",
          { color: "red", width: 500 },
        )
      ) {
        try {
          await obfuscationApi.deletePreobfuscatedModules(config.language);
          this.$snack.success("Preobfuscated modules deleted.");
        } catch (e) {
          this.$snack.error(`${e}`);
        }
      }
    },
  },
};
</script>

<style></style>
