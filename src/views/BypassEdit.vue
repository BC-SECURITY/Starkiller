<template>
  <div>
    <edit-page-top
      :breads="breads"
      :show-submit="true"
      :show-copy="true"
      :show-delete="!canEdit"
      :submit-loading="loading"
      :copy-link="copyLink"
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
    <v-card
      v-else
      style="padding: 10px"
    >
      <v-form
        ref="form"
        v-model="valid"
        @submit.prevent.native="submit"
      >
        <v-text-field
          v-model="form.name"
          :rules="rules['name']"
          label="name"
          outlined
          dense
          required
          :disabled="!isNew"
        />
        <v-textarea
          v-model="form.code"
          :rules="rules['code']"
          label="code"
          outlined
          dense
          required
          auto-grow
        />
      </v-form>
    </v-card>
  </div>
</template>

<script>
import Vue from 'vue';
import ErrorStateAlert from '@/components/ErrorStateAlert.vue';
import EditPageTop from '@/components/EditPageTop.vue';
import * as bypassApi from '@/api/bypass-api';

export default {
  name: 'BypassEdit',
  components: {
    ErrorStateAlert,
    EditPageTop,
  },
  data() {
    return {
      form: {},
      rules: {
        name: [
          (v) => !!v || 'Name is required',
          (v) => (!!v && v.length > 2) || 'Name must be larger than 2 characters',
        ],
        code: [
          (v) => !!v || 'Code is required',
        ],
      },
      bypass: {},
      valid: true,
      loading: false,
      errorState: false,
    };
  },
  computed: {
    breads() {
      return [
        {
          text: 'Bypasses',
          disabled: false,
          to: '/bypasses',
          exact: true,
        },
        {
          text: this.breadcrumbName,
          disabled: true,
          to: '/bypasses-edit',
        },
      ];
    },
    breadcrumbName() {
      if (this.isCopy) return 'New';
      if (this.form.name) return this.form.name;
      if (this.id) return this.id;
      return 'New';
    },
    isNew() {
      return this.$route.name === 'bypassNew';
    },
    isCopy() {
      return this.$route.params.copy === true;
    },
    mode() {
      if (this.isCopy) return 'Copy';
      if (this.isNew) return 'New';
      return 'View';
    },
    canEdit() {
      return this.isNew;
    },
    id() {
      return this.$route.params.id;
    },
    copyLink() {
      if (!this.canEdit) return { name: 'bypassNew', params: { copy: true, id: this.id } };
      return {};
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
      this.getBypass(this.id);
    }
  },
  methods: {
    async submit() {
      if (this.loading || !this.$refs.form.validate()) {
        return;
      }
      this.loading = true;
      if (this.isNew) {
        await this.create();
      } else {
        await this.update();
      }
      this.loading = false;
    },
    create() {
      return bypassApi.createBypass(this.form.name, this.form.code)
        .then((res) => {
          console.log(res);
          this.$router.push({ name: 'bypassEdit', params: { id: res.id } });
        })
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    update() {
      return bypassApi.updateBypass(this.form.id, this.form.name, this.form.code)
        .then(() => this.$router.push({ name: 'bypasses' }))
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    getBypass(id) {
      bypassApi.getBypass(id)
        .then((data) => {
          this.bypass = { ...data };
          Vue.set(this, 'form', { ...data });
        })
        .catch(() => {
          this.errorState = true;
        });
    },
    async deleteBypass() {
      if (await this.$root.$confirm('Delete', `Are you sure you want to delete bypass ${this.form.name}?`, { color: 'red' })) {
        try {
          await this.$store.dispatch('bypass/deleteBypass', this.form.id);
          this.$router.push({ name: 'bypasses' });
        } catch (err) {
          this.$snack.error(`Error: ${err}`);
        }
      }
    },
  },
};
</script>

<style>
</style>
