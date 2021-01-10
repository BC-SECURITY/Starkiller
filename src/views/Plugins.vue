<template>
  <div>
    <v-breadcrumbs :items="breads" />

    <div class="headers">
      <h3>Plugins</h3>
    </div>
    <v-data-table
      :headers="headers"
      :items="plugins"
      @click:row="viewPlugin"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'Plugins',
  components: {
  },
  data() {
    return {
      breads: [
        {
          text: 'Plugins',
          disabled: true,
          href: '/plugins',
        },
      ],
      headers: [
        { text: 'Name', value: 'Name' },
        { text: 'Description', value: 'Description' },
      ],
    };
  },
  computed: {
    ...mapState({
      plugins: state => state.plugin.plugins,
    }),
  },
  mounted() {
    this.getPlugins();
  },
  methods: {
    getPlugins() {
      this.$store.dispatch('plugin/getPlugins');
    },
    viewPlugin(item) {
      this.$router.push({ name: 'pluginExecute', params: { id: item.Name } });
    },
  },
};
</script>

<style>
</style>
