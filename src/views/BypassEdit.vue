<template>
  <div>
    <edit-page-top
      :breads="breads"
      :show-submit="initialLoad"
      :disable-submit="!canEdit && initialLoad"
      :show-copy="id > 0 && initialLoad"
      :show-delete="id > 0 && initialLoad"
      :submit-loading="loading && initialLoad"
      :copy-link="copyLink"
      :small-copy="true"
      :small-delete="true"
      @submit="submit"
      @delete="deleteBypass"
    />
    <div class="headers">
      <h3>{{ mode }} Bypass</h3>
    </div>
    <error-state-alert
      v-if="errorState"
      :resource-id="id"
      resource-type="bypass"
    />
    <v-card v-else style="padding: 10px">
      <v-form ref="form" v-model="valid" @submit.prevent="submit">
        <v-text-field
          v-model="form.name"
          :rules="rules['name']"
          label="name"
          variant="outlined"
          density="compact"
          required
          :disabled="!isNew"
        />
        <v-text-field
          v-model="form.language"
          :rules="rules['language']"
          label="language"
          variant="outlined"
          density="compact"
          required
        />
        <v-textarea
          v-model="form.code"
          :rules="rules['code']"
          label="code"
          variant="outlined"
          density="compact"
          required
          auto-grow
        />
      </v-form>
    </v-card>
  </div>
</template>

<script>
import ErrorStateAlert from "@/components/ErrorStateAlert.vue";
import EditPageTop from "@/components/EditPageTop.vue";
import * as bypassApi from "@/api/bypass-api";
import { useBypassStore } from "@/stores/bypass-module";

export default {
  name: "BypassEdit",
  components: {
    ErrorStateAlert,
    EditPageTop,
  },
  inject: ["snack", "confirm"],
  data() {
    return {
      form: {},
      rules: {
        name: [
          (v) => !!v || "Name is required",
          (v) =>
            (!!v && v.length > 2) || "Name must be larger than 2 characters",
        ],
        language: [
          (v) => !!v || "Language is required",
          (v) =>
            (!!v && v.length > 2) ||
            "Language must be larger than 2 characters",
        ],
        code: [(v) => !!v || "Code is required"],
      },
      bypass: {},
      valid: true,
      loading: false,
      errorState: false,
    };
  },
  computed: {
    bypassStore() {
      return useBypassStore();
    },
    isNew() {
      return this.$route.name === "bypassNew";
    },
    isCopy() {
      return this.$route.params.copy === true;
    },
    mode() {
      if (this.isCopy) return "Copy";
      if (this.isNew) return "New";
      return "View";
    },
    canEdit() {
      return true;
    },
    id() {
      return this.isCopy ? 0 : this.$route.params.id;
    },
    copyLink() {
      if (this.id > 0)
        return { name: "bypassNew", params: { copy: true, id: this.id } };
      return {};
    },
    breads() {
      return [
        {
          title: "Bypasses",
          disabled: false,
          to: "/bypasses",
          exact: true,
        },
        {
          title: this.breadcrumbName,
          disabled: true,
          to: "/bypasses-edit",
        },
      ];
    },
    breadcrumbName() {
      if (this.isCopy) return "New";
      if (this.form.name) return this.form.name;
      if (this.id) return this.id;
      return "New";
    },
  },
  watch: {
    id(val) {
      if (val) {
        this.getBypass(val);
      }
    },
  },
  mounted() {
    if (!this.isNew || this.isCopy) {
      // using the route param id instad of this.id
      // since this.id is 0 for copies.
      this.getBypass(this.$route.params.id);
    } else {
      this.initialLoad = true;
    }
  },
  methods: {
    async submit() {
      if (this.loading) return;
      const { valid } = await this.$refs.form.validate();
      if (!valid) return;

      this.loading = true;
      if (this.id > 0) {
        bypassApi
          .updateBypass(
            this.form.id,
            this.form.name,
            this.form.code,
            this.form.language,
          )
          .then(() => {
            this.snack.success("Bypass updated");
            this.loading = false;
          })
          .catch((err) => {
            this.snack.error(`Error: ${err}`);
            this.loading = false;
          });
      } else {
        bypassApi
          .createBypass(this.form.name, this.form.code, this.form.language)
          .then(({ id }) => {
            this.snack.success("Bypass created");
            this.loading = false;
            this.$router.push({ name: "bypassEdit", params: { id } });
          })
          .catch((err) => {
            this.snack.error(`Error: ${err}`);
            this.loading = false;
          });
      }
    },
    async deleteBypass() {
      if (
        await this.confirm(
          "Delete",
          `Are you sure you want to delete bypass ${this.form.name}?`,
          { color: "red" },
        )
      ) {
        try {
          this.bypassStore.deleteBypass(this.form.id);
          this.$router.push({ name: "bypasses" });
        } catch (err) {
          this.snack.error(`Error: ${err}`);
        }
      }
    },
    getBypass(id) {
      bypassApi
        .getBypass(id)
        .then((data) => {
          this.bypass = { ...data };
          this.initialLoad = true;
          this.form = { ...data };
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
