<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="false"
      :show-delete="false"
    />
    <v-data-table
      :headers="headers"
      :items="plugins"
      dense
    >
      <template #item.Name="{ item }">
        <router-link
          style="color: inherit;"
          :to="{ name: 'pluginExecute', params: { id: item.Name } }"
        >
          {{ item.Name }}
        </router-link>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import ListPageTop from '@/components/ListPageTop.vue';

export default {
  name: 'Plugins',
  components: {
    ListPageTop,
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
        { text: 'Author', value: 'Author' },
      ],
    };
  },
  computed: {
    ...mapState({
      plugins: (state) => state.plugin.plugins,
    }),
  },
  mounted() {
    this.getPlugins();
  },
  methods: {
    getPlugins() {
      this.$store.dispatch('plugin/getPlugins');
    },
  },
};
</script>

<style>
</style>
