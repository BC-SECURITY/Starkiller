<template>
  <div>
    <edit-page-top
      :breads="breads"
      :show-submit="canEdit"
      :show-copy="!canEdit"
      :show-delete="!canEdit"
      :submit-loading="loading"
      :copy-link="copyLink"
      @submit="create"
      @delete="deleteStager"
    />
    <h3>{{ mode }} Stager</h3>
    <error-state-alert
      v-if="errorState"
      :resource-id="id"
      resource-type="stager"
    />
    <v-card
      v-else
      style="padding: 10px"
    >
      <info-viewer
        class="info-viewer"
        :info-array="stagerInfoArray"
      />
      <v-autocomplete
        v-model="stagerType"
        :items="stagerTypes"
        :loading="!reset"
        dense
        outlined
        label="Type"
        :readonly="!canEdit"
      />
      <general-form
        v-if="reset"
        ref="generalform"
        v-model="form"
        :options="stagerOptions"
        :priority="formPriorities"
        :readonly="!canEdit"
      />
    </v-card>
  </div>
</template>

<script>
import * as stagerApi from '@/api/stager-api';
import { mapGetters } from 'vuex';
import InfoViewer from '@/components/InfoViewer.vue';
import GeneralForm from '@/components/GeneralForm.vue';
import ErrorStateAlert from '@/components/ErrorStateAlert.vue';
import EditPageTop from '@/components/EditPageTop.vue';
import { namespacedElectronStore } from '@/store/electron-store';

export default {
  name: 'StagerEdit',
  components: {
    InfoViewer,
    GeneralForm,
    ErrorStateAlert,
    EditPageTop,
  },
  data() {
    return {
      stager: { options: {} },
      form: {},
      stagerType: '',
      loading: false,
      reset: true,
      formPriorities: ['StarkillerName', 'Listener', 'Language'],
      initialLoad: true,
      errorState: false,
    };
  },
  computed: {
    ...mapGetters({
      stagerTypes: 'stager/stagerTypes',
    }),
    isNew() {
      return this.$route.name === 'stagerNew';
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
      if (!this.canEdit) return { name: 'stagerNew', params: { copy: true, id: this.id } };
      return {};
    },
    breads() {
      return [
        {
          text: 'Stagers',
          disabled: false,
          to: '/stagers',
          exact: true,
        },
        {
          text: this.breadcrumbName,
          disabled: true,
          to: '/stagers-edit',
        },
      ];
    },
    breadcrumbName() {
      if (this.stagerOptions?.StarkillerName?.Value) return this.stagerOptions.StarkillerName.Value;
      if (this.id) return this.id;
      return 'New';
    },
    stagerOptions() {
      const { options } = this.stager;
      if (Object.keys(options).length > 0 && !options.StarkillerName) {
        options.StarkillerName = {
          Description: 'A name only stored client side in Starkiller',
          Required: true,
          Strict: false,
          SuggestedValues: [],
          Value: this.stager.Name,
        };
      }

      return options;
    },
    stagerInfoArray() {
      const a = this.stager;
      if (Object.keys(a).length === 1) return [];

      return [
        { key: 'Author', value: a.Author ? a.Author.join(', ') : '' },
        { key: 'Comments', value: a.Comments ? a.Comments.join('\n') : '' },
        { key: 'Description', value: a.Description },
      ];
    },
  },
  watch: {
    /**
     * When the type dropdown changes, we get the options for the new type.
     */
    stagerType: {
      async handler(val) {
        // if its not new OR its a copy, then we want to let mounted call for the stager
        // we are viewing.
        if (!this.isNew || this.isCopy) {
          if (this.initialLoad) {
            return;
          }
        }
        const a = await stagerApi.getStagerByName(val)
          .catch((err) => this.$snack.error(`Error: ${err}`));
        if (a) {
          this.reset = false;

          this.stager = a;
          setTimeout(() => { this.reset = true; }, 500);
        }
      },
    },
    id(val) {
      if (val) {
        this.getStager(val);
      }
    },
  },
  mounted() {
    this.$store.dispatch('stager/getStagerTemplates');
    if (!this.isNew || this.isCopy) {
      this.getStager(this.id);
    }
  },
  methods: {
    create() {
      if (this.loading || !this.$refs.generalform.$refs.form.validate()) {
        return '';
      }
      this.loading = true;
      const form2 = { StagerName: this.stagerType, ...this.form };
      delete form2.StarkillerName;
      delete form2.name;
      delete form2.id;
      delete form2.createdAt;
      delete form2.Output;
      return stagerApi.generateStager(form2)
        .then((stager) => {
          // eslint-disable-next-line no-param-reassign
          stager[this.stagerType].StarkillerName = {
            Description: 'A name only stored client side in Starkiller',
            Required: true,
            Strict: false,
            SuggestedValues: [],
            Value: this.form.StarkillerName,
          };
          this.$store.dispatch('stager/addStager', stager);
          // electron-store is slower and needs some time to save
          // before we go back to the list view.
          setTimeout(() => {
            this.$router.push({ name: 'stagers' });
            this.loading = false;
          }, 2500);
        })
        .catch((err) => {
          this.$snack.error(`Error: ${err}`);
          this.loading = false;
        });
    },
    async deleteStager() {
      if (await this.$root.$confirm('Delete', `Are you sure you want to delete stager ${this.form.StarkillerName}?`, { color: 'red' })) {
        try {
          await this.$store.dispatch('stager/deleteStager', this.id);
          this.$router.push({ name: 'stagers' });
        } catch (err) {
          this.$snack.error(`Error: ${err}`);
        }
      }
    },
    getStager(id) {
      const arr = namespacedElectronStore.get('generatedStagers', []);
      const found = arr.find((s) => s.id === id);

      if (!found) this.errorState = true;

      this.stager = { options: { ...found } };
      this.stagerType = this.stager.options.name; // todo dont use the name. allow name edits?
      setTimeout(() => { this.initialLoad = false; }, 500);
    },
  },
};
</script>

<style>

</style>
