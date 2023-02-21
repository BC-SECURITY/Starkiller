<template>
  <div>
    <portal
      to="app-bar-extension"
    >
      <div style="display: flex; flex-direction: row; width:100%">
        <v-tabs
          v-model="tab"
          align-with-title
        >
          <v-tab
            key="list-view"
            href="#list-view"
          >
            List
            <v-icon x-small class="ml-1">
              fa-list
            </v-icon>
          </v-tab>
        </v-tabs>
      </div>
    </portal>
    <v-tabs-items
      v-model="tab"
    >
      <v-tab-item
        key="list-view"
        :value="'list-view'"
        :transition="false"
        :reverse-transition="false"
      >
        <v-card
          flat
        >
          <agents-list :active="tab === 'list-view'" />
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script>
import AgentsList from '@/components/agents/AgentsList.vue';

export default {
  name: 'Agents',
  components: {
    AgentsList,
  },
  data() {
    return {
    };
  },
  computed: {
    // https://jareklipski.medium.com/linking-to-a-specific-tab-in-vuetify-js-d978525f2e1a
    tab: {
      set(tab) {
        this.$router.replace({ query: { ...this.$route.query, tab } });
      },
      get() {
        return this.$route.query.tab || 'list-view';
      },
    },
  },
};
</script>

<style lang="scss">
.warning-row {
  background-color: #FFCCCC;
}

.v-data-table.theme--dark
  .warning-row {
    background-color: #bd4c4c;
  }

// Overrides vuetify.css
// Because we moved the tabs into a div, which made the color funky.
.v-toolbar__content > div > .v-tabs > .v-slide-group.v-tabs-bar,
.v-toolbar__extension > div > .v-tabs > .v-slide-group.v-tabs-bar {
  background-color: inherit;
}
</style>
