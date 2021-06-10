<template>
  <div>
    <edit-page-top
      :breads="breads"
      :show-submit="canEdit"
      :show-copy="!canEdit"
      :show-delete="!canEdit"
      :submit-loading="loading"
      :copy-link="copyLink"
      @submit="submit"
      @delete="kill"
    />
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
        :info-array="listenerInfoArray"
      />
      <v-autocomplete
        v-model="listenerType"
        :items="listenerTypes"
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
        :options="listenerOptions"
        :priority="formPriorities"
        :readonly="!canEdit"
      />
    </v-card>
  </div>
</template>

<script>
import * as listenerApi from '@/api/listener-api';
import { mapState } from 'vuex';
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
      listenerType: '',
      form: {},
      reset: true,
      loading: false,
      formPriorities: ['Name', 'Host', 'Port'],
      initialLoad: true,
      errorState: false,
    };
  },
  computed: {
    ...mapState({
      listenerTypes: (state) => state.listener.types,
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
      return this.isNew;
    },
    id() {
      return this.$route.params.id;
    },
    copyLink() {
      if (!this.canEdit) return { name: 'listenerNew', params: { copy: true, id: this.id } };
      return {};
    },
    listenerInfoArray() {
      const a = this.listener.info || {};
      if (Object.keys(a).length === 0) return [];

      return [
        { key: 'Author', value: a.Author ? a.Author.join(', ') : '' },
        { key: 'Comments', value: a.Comments ? a.Comments.join('\n') : '' },
        { key: 'Description', value: a.Description },
      ];
    },
    listenerOptions() {
      return this.listener.options;
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
          text: this.id && !this.isCopy ? `${this.id}` : 'New',
          disabled: true,
          to: '/listeners-edit',
        },
      ];
    },
  },
  watch: {
    listenerType: {
      async handler(val) {
        // if its not new OR its a copy, then we want to let mounted call for the listener
        // we are viewing.
        if (!this.isNew || this.isCopy) {
          if (this.initialLoad) {
            return;
          }
        }
        const a = await listenerApi.getListenerOptions(val)
          .catch((err) => this.$snack.error(`Error: ${err}`));
        if (a) {
          this.reset = false;

          this.listener = a;
          setTimeout(() => { this.reset = true; }, 500);
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
    this.$store.dispatch('listener/getListenerTypes');

    if (!this.isNew || this.isCopy) {
      this.getListener(this.id);
    }
  },
  methods: {
    async submit() {
      if (this.loading || !this.$refs.generalform.$refs.form.validate()) {
        return;
      }

      this.loading = true;
      await this.create();
      this.loading = false;
    },
    create() {
      return listenerApi.createListener(this.listenerType, this.form)
        .then(() => {
          this.$router.push({ name: 'listenerEdit', params: { id: this.form.Name } });
        })
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    async kill() {
      if (await this.$root.$confirm('Delete', `Are you sure you want to kill listener ${this.form.Name}?`, { color: 'red' })) {
        try {
          await this.$store.dispatch('listener/killListener', this.form.Name);
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
          this.listenerType = data.module;
          setTimeout(() => { this.initialLoad = false; }, 500);
        })
        .catch(() => {
          this.errorState = true;
        });
    },
  },
};
</script>

<style>
</style>
