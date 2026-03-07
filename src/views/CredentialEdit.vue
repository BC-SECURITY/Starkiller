<template>
  <div>
    <edit-page-top
      :breads="breads"
      :show-submit="initialLoad"
      :show-copy="id > 0 && initialLoad"
      :show-delete="id > 0 && initialLoad"
      :submit-loading="loading && initialLoad"
      :copy-link="copyLink"
      :small-copy="true"
      :small-delete="true"
      @submit="submit"
      @delete="deleteCredential"
    />
    <h3>{{ mode }} Credential</h3>
    <tag-viewer
      v-if="!isNew"
      :tags="credential.tags"
      @update-tag="updateTag"
      @delete-tag="deleteTag"
      @new-tag="addTag"
    />
    <error-state-alert
      v-if="errorState"
      :resource-id="id"
      resource-type="credential"
    />
    <v-card v-else style="padding: 10px">
      <general-form
        v-if="initialLoad"
        :key="credential.id"
        ref="generalform"
        v-model="form"
        :options="options"
        :readonly="!canEdit"
      />
    </v-card>
  </div>
</template>

<script>
import GeneralForm from "@/components/GeneralForm.vue";
import ErrorStateAlert from "@/components/ErrorStateAlert.vue";
import EditPageTop from "@/components/EditPageTop.vue";
import TagViewer from "@/components/TagViewer.vue";
import * as credentialApi from "@/api/credential-api";
import { useCredentialStore } from "@/stores/credential-module";

export default {
  name: "CredentialEdit",
  components: {
    TagViewer,
    GeneralForm,
    ErrorStateAlert,
    EditPageTop,
  },
  inject: ["snack", "confirm"],
  data() {
    return {
      loading: false,
      initialLoad: false,
      credential: {},
      form: {},
      errorState: false,
    };
  },
  computed: {
    breads() {
      return [
        {
          title: "Credentials",
          disabled: false,
          to: "/credentials",
          exact: true,
        },
        {
          title: this.id && !this.isCopy ? `${this.id}` : "New",
          disabled: true,
          to: `/credentials/${this.id}`,
        },
      ];
    },
    credentialStore() {
      return useCredentialStore();
    },
    isNew() {
      return this.$route.name === "credentialNew";
    },
    isCopy() {
      return this.$route.query.copy === "true";
    },
    mode() {
      if (this.isCopy) return "Copy";
      if (this.isNew) return "New";
      return "Edit";
    },
    canEdit() {
      // if we want to introduce separate view/edit modes, we can do that here.
      return true;
    },
    id() {
      return this.isCopy ? 0 : this.$route.params.id || this.$route.query.id;
    },
    copyLink() {
      if (this.id > 0)
        return { name: "credentialNew", query: { copy: true, id: this.id } };
      return {};
    },
    options() {
      const op = {
        credtype: {
          required: true,
          strict: true,
          suggested_values: ["plaintext", "hash"],
        },
        domain: { required: true },
        username: { required: true },
        password: { required: true },
        host: { required: true },
        os: { required: false },
        sid: { required: false },
        notes: { required: false },
      };
      Object.keys(this.credential).forEach((field) => {
        if (field !== "id" && op[field]) {
          op[field].value = this.credential[field];
        }
      });
      return op;
    },
  },
  watch: {
    id(val) {
      if (val) {
        this.getCredential(val);
      }
    },
  },
  mounted() {
    if (!this.isNew || this.isCopy) {
      // using the route param id instad of this.id
      // since this.id is 0 for copies.
      this.getCredential(this.$route.params.id || this.$route.query.id);
    } else {
      this.initialLoad = true;
    }
  },
  methods: {
    deleteTag(tag) {
      credentialApi
        .deleteTag(this.credential.id, tag.id)
        .then(() => {
          this.credential.tags = this.credential.tags.filter((t) => t !== tag);
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    updateTag(tag) {
      credentialApi
        .updateTag(this.credential.id, tag)
        .then((t) => {
          const index = this.credential.tags.findIndex((x) => x.id === t.id);
          this.credential.tags.splice(index, 1, t);
          this.snack.success("Tag updated");
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    addTag(tag) {
      credentialApi
        .addTag(this.credential.id, tag)
        .then((t) => {
          this.credential.tags.push(t);
        })
        .catch((err) => this.snack.error(`Error: ${err}`));
    },
    async submit() {
      if (this.loading) return;
      const valid = await this.$refs.generalform.validate();
      if (!valid) return;

      this.loading = true;
      if (this.id > 0) {
        credentialApi
          .updateCredential(this.id, this.form)
          .then(() => {
            this.loading = false;
          })
          .catch((err) => {
            this.snack.error(`Error: ${err}`);
            this.loading = false;
          });
      } else {
        credentialApi
          .createCredential(this.form)
          .then(({ id }) => {
            this.loading = false;
            this.$router.push({ name: "credentialEdit", params: { id } });
          })
          .catch((err) => {
            this.snack.error(`Error: ${err}`);
            this.loading = false;
          });
      }
      this.loading = false;
    },
    async deleteCredential() {
      if (
        await this.confirm(
          "Delete",
          `Are you sure you want to delete credential ${this.id}?`,
          { color: "red" },
        )
      ) {
        try {
          this.credentialStore.deleteCredential(this.id);
          this.$router.push({ name: "credentials" });
        } catch (err) {
          this.snack.error(`Error: ${err}`);
        }
      }
    },
    getCredential(id) {
      credentialApi
        .getCredential(id)
        .then((data) => {
          this.credential = data;
          this.initialLoad = true;
        })
        .catch((err) => {
          console.error(err);
          this.snack.error(`Failed to load resource: ${err}`);
          this.errorState = true;
        });
    },
  },
};
</script>

<style></style>
