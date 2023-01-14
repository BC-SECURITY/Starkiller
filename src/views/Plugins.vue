<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="false"
      :show-delete="false"
      :show-refresh="true"
      @refresh="getPlugins"
    />
    <v-data-table
      :headers="headers"
      :items="plugins"
      dense
    >
      <template #item.name="{ item }">
        <router-link
          style="color: inherit;"
          :to="{ name: 'pluginEdit', params: { id: item.id } }"
        >
          {{ item.name }}
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
        { text: 'Name', value: 'name' },
        { text: 'Description', value: 'description' },
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
