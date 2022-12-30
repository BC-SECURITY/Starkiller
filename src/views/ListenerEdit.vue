<template>
  <div>
    <edit-page-top
      :breads="breads"
      :show-submit="initialLoad"
      :disable-submit="!canEdit && initialLoad"
      :show-copy="id > 0 && initialLoad"
      :show-delete="id > 0 && initialLoad"
      :submit-loading="loading"
      :copy-link="copyLink"
      :small-copy="true"
      :small-delete="true"
      @submit="submit"
      @delete="kill"
    >
      <template slot="extra-stuff">
        <v-switch
          v-if="!isNew && initialLoad"
          v-model="listener.enabled"
          color="green"
          label="Enabled"
          class="mt-6 mr-2"
          @change="toggleEnabled"
        />
        <v-menu
          v-if="!isNew && initialLoad"
          offset-y
          open-on-hover
        >
          <template #activator="{ on, attrs }">
            <v-btn
              class="mr-5"
              text
              icon
              small
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>fa-suitcase-rolling</v-icon>
            </v-btn>
          </template>
          <v-list class="ml-2 mr-2">
            <v-list-item
              v-for="(item, index) in commonStagers"
              :key="index"
              link
              :to="{ name: 'stagerNew', query: { template: item, listener: listener.name } }"
            >
              <v-list-item-title>
                {{ item }}
              </v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item
              link
              :to="{ name: 'stagerNew' }"
            >
              <v-list-item-title>
                Other
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </edit-page-top>
    <div class="headers">
      <h3>{{ mode }} Listener</h3>
    </div>
    <error-state-alert
      v-if="errorState"
      :resource-id="id"
      resource-type="listener"
    />
    <v-card
      v-else
      style="padding: 10px"
    >
      <info-viewer
        class="info-viewer"
        :info="listenerInfo"
      />
      <v-autocomplete
        v-model="selectedTemplate"
        :items="listenerTemplateIds"
        :loading="!reset"
        dense
        outlined
        label="Type"
        :readonly="!canEdit"
      />
      <v-alert
        v-if="validationMessage"
        prominent
        type="warning"
      >
        <v-row align="center">
          <v-col
            class="grow"
            style="word-wrap: word-break; width: 500px"
          >
            {{ validationMessage }}
          </v-col>
        </v-row>
      </v-alert>
      <general-form
        v-if="reset"
        ref="generalform"
        v-model="form"
        :options="listenerOptions"
        :priority="formPriorities"
        :readonly="!canEdit"
      />
    </v-card>
  </div>
</template>

<script>
import * as listenerApi from '@/api/listener-api';
import { mapGetters } from 'vuex';
import GeneralForm from '@/components/GeneralForm.vue';
import InfoViewer from '@/components/InfoViewer.vue';
import EditPageTop from '@/components/EditPageTop.vue';
import ErrorStateAlert from '@/components/ErrorStateAlert.vue';

export default {
  name: 'ListenerEdit',
  components: {
    InfoViewer,
    GeneralForm,
    ErrorStateAlert,
    EditPageTop,
  },
  data() {
    return {
      listener: { options: {} },
      listenerTemplate: { options: {} },
      selectedTemplate: '',
      form: {},
      reset: true,
      loading: false,
      formPriorities: ['Name', 'Host', 'Port'],
      errorState: false,
      validationMessage: null,
      initialLoad: false,
      commonStagers: [
        'multi_launcher',
        'multi_macro',
        'windows_csharp_exe',
        'windows_dll',
        'windows_shellcode',
      ],
    };
  },
  computed: {
    ...mapGetters({
      listenerTemplateIds: 'listener/templateIds',
    }),
    isNew() {
      return this.$route.name === 'listenerNew';
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
      return this.isNew || !this.listener.enabled;
    },
    id() {
      return this.isCopy ? 0 : this.$route.params.id;
    },
    copyLink() {
      if (this.id > 0) return { name: 'listenerNew', params: { copy: true, id: this.id } };
      return {};
    },
    listenerInfo() {
      if (!this.listenerTemplate) return {};
      const a = this.listenerTemplate;
      return { authors: a.authors, description: a.description, comments: a.comments };
    },
    listenerOptions() {
      if (!this.isNew || this.isCopy) {
        // if its not new, set the options
        // iterate over the options in this.listener and set the values
        const options = {};
        Object.keys(this.listener.options).forEach((key) => {
          options[key] = { ...this.listenerTemplate.options[key] };
          options[key].value = this.listener.options[key];
        });
        return options;
      }

      // if its new, use the defaults from the template
      const { options } = this.listenerTemplate;
      if (!options) return {};
      return options;
    },
    breads() {
      return [
        {
          text: 'Listeners',
          disabled: false,
          to: '/listeners',
          exact: true,
        },
        {
          text: this.breadcrumbName,
          disabled: true,
          to: '/listeners-edit',
        },
      ];
    },
    breadcrumbName() {
      if (this.isCopy) return 'New';
      if (this.listener.name) return this.listener.name;
      if (this.id) return this.id;
      return 'New';
    },
  },
  watch: {
    selectedTemplate: {
      async handler(val) {
        const a = await listenerApi.getListenerTemplate(val)
          .catch((err) => this.$snack.error(`Error: ${err}`));
        if (a) {
          this.reset = false;

          this.listenerTemplate = a;
          await this.$nextTick();
          this.reset = true;
          this.initialLoad = true;
        }
      },
    },
    id(val) {
      if (val) {
        this.getListener(val);
      }
    },
  },
  mounted() {
    this.$store.dispatch('listener/getListenerTemplates');

    if (!this.isNew || this.isCopy) {
      // using the route param id instad of this.id
      // since this.id is 0 for copies.
      this.getListener(this.$route.params.id);
    }
  },
  methods: {
    async submit() {
      if (this.loading || !this.$refs.generalform.$refs.form.validate()) {
        return;
      }

      this.loading = true;
      if (this.id > 0) {
        listenerApi.updateListener({ ...this.listener, options: this.form })
          .then(() => {
            this.$snack.success('Listener updated');
            this.loading = false;
          })
          .catch((err) => {
            // if (typeof err === 'object') {
            // err.details.forEach((detail) => {
            // Here we could set an error object on the form
            // Hot going to do it atm since it would require doing
            // some refactoring of the GeneralForm and DynamicFormInput
            // and most (all?) of the validations that would be needed
            // are already done client side.
            // const field = detail.loc[1]
            // this.errors[field] = detail.msg
            // });
            if (err.startsWith('[*]')) {
              this.validationMessage = err;
            } else {
              this.$snack.error(`Error: ${err}`);
            }
            this.loading = false;
          });
      } else {
        listenerApi.createListener(this.selectedTemplate, this.form)
          .then(({ id }) => {
            this.$snack.success('Listener created');
            this.loading = false;
            this.$router.push({ name: 'listenerEdit', params: { id } });
          })
          .catch((err) => {
            if (err.startsWith('[*]')) {
              this.validationMessage = err;
            } else {
              this.$snack.error(`Error: ${err}`);
            }
            this.loading = false;
          });
      }
    },
    async kill() {
      if (await this.$root.$confirm('Delete', `Are you sure you want to kill listener ${this.form.Name}?`, { color: 'red' })) {
        try {
          await this.$store.dispatch('listener/killListener', this.id);
          this.$router.push({ name: 'listeners' });
        } catch (err) {
          this.$snack.error(`Error: ${err}`);
        }
      }
    },
    getListener(id) {
      listenerApi.getListener(id)
        .then((data) => {
          this.listener = data;
          this.selectedTemplate = data.template;
        })
        .catch(() => {
          this.errorState = true;
        });
    },
    async toggleEnabled(val) {
      this.listener.enabled = val;

      if (val === true && !await this.$root.$confirm('', 'Re-enabling the listener will also save any unsaved option changes.', { color: 'yellow' })) {
        this.listener.enabled = !val;
        return;
      }

      try {
        const response = await listenerApi.updateListener({ ...this.listener, options: this.form });
        this.listener = response;
      } catch (err) {
        this.listener.enabled = !val;
        this.$snack.error(`Error: ${err}`);
      }
    },
  },
};
</script>

<style>
</style>
