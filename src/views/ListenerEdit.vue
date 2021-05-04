<template>
  <div>
    <v-breadcrumbs :items="breads" />
    <div class="headers">
      <h3>{{ mode }} Listener</h3>
    </div>
    <v-card style="padding: 10px">
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
        :options="listenerOptions"
        :priority="formPriorities"
        :loading="loading"
        :readonly="!canEdit"
        @submit="submit"
      />
    </v-card>
  </div>
</template>

<script>
import * as listenerApi from '@/api/listener-api';
import { mapState } from 'vuex';
import GeneralForm from '@/components/GeneralForm.vue';
import InfoViewer from '@/components/InfoViewer.vue';

export default {
  name: 'ListenerEdit',
  components: {
    InfoViewer,
    GeneralForm,
  },
  data() {
    return {
      listener: { options: {} },
      listenerType: '',
      reset: true,
      loading: false,
      formPriorities: ['Name', 'Host', 'Port'],
    };
  },
  computed: {
    ...mapState({
      listenerTypes: state => state.listener.types,
    }),
    isNew() {
      return this.$route.name === 'listenerNew';
    },
    mode() {
      if (this.isNew) return 'New';
      return 'View';
    },
    canEdit() {
      return this.isNew;
    },
    id() {
      return this.$route.params.id;
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
          text: this.id ? `${this.id}` : 'New',
          disabled: true,
          to: '/listeners-edit',
        },
      ];
    },
  },
  watch: {
    listenerType: {
      async handler(val) {
        const a = await listenerApi.getListenerOptions(val)
          .catch(err => this.$toast.error(`Error: ${err}`));
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

    if (!this.isNew) {
      this.getListener(this.id);
    }
  },
  methods: {
    async submit(form) {
      if (this.loading) {
        return;
      }

      this.loading = true;
      await this.create(form);
      this.loading = false;
    },
    create(form) {
      return listenerApi.createListener(this.listenerType, form)
        .then(() => {
          console.log('VR HEY');
          this.$router.push({ name: 'listenerEdit', params: { id: form.Name } });
        })
        .catch(err => this.$toast.error(`Error: ${err}`));
    },
    getListener(id) {
      listenerApi.getListener(id)
        .then((data) => {
          this.listener = data;
          this.listenerType = data.module;
        });
    },
  },
};
</script>

<style>
</style>
