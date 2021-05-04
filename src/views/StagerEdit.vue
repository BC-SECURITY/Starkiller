<template>
  <div>
    <v-breadcrumbs :items="breads" />
    <h3>{{ id ? 'Edit' : 'New' }} Stager</h3>
    <v-card style="padding: 10px">
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
      />
      <general-form
        v-if="reset"
        :options="stagerOptions"
        :loading="loading"
        :priority="formPriorities"
        @submit="create"
      />
    </v-card>
  </div>
</template>

<script>
import * as stagerApi from '@/api/stager-api';
import { mapGetters } from 'vuex';
import InfoViewer from '@/components/InfoViewer.vue';
import GeneralForm from '@/components/GeneralForm.vue';

export default {
  name: 'StagerEdit',
  components: {
    InfoViewer,
    GeneralForm,
  },
  data() {
    return {
      stager: { options: {} },
      stagerType: '',
      loading: false,
      reset: true,
      formPriorities: ['Listener', 'Language'],
    };
  },
  computed: {
    ...mapGetters({
      stagerTypes: 'stager/stagerTypes',
    }),
    isNew() {
      return this.$route.name === 'stagerNew';
    },
    id() {
      return this.$route.params.id;
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
          text: this.id ? `Edit ${this.id}` : 'New',
          disabled: true,
          to: '/stagers-edit',
        },
      ];
    },
    stagerOptions() {
      return this.stager.options;
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
        const a = await stagerApi.getStagerByName(val)
          .catch(err => this.$toast.error(`Error: ${err}`));
        if (a) {
          this.reset = false;

          this.stager = a;
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
    this.$store.dispatch('stager/getStagers');
  },
  methods: {
    create(form) {
      this.loading = true;
      return stagerApi.generateStager({ StagerName: this.stagerType, ...form })
        .then((stager) => {
          this.$store.dispatch('stager/addStager', stager);
          // electron-store is slower and needs some time to save
          // before we go back to the list view.
          setTimeout(() => {
            this.$router.push({ name: 'stagers' });
            this.loading = false;
          }, 2500);
        })
        .catch((err) => {
          this.$toast.error(`Error: ${err}`);
          this.loading = false;
        });
    },
  },
};
</script>

<style>

</style>
