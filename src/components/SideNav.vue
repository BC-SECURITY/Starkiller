<template>
  <div>
    <v-navigation-drawer
      app
      permanent
      :expand-on-hover="expandOnHover"
      :mini-variant="mini"
    >
      <v-list
        dense
        nav
        class="px-0"
      >
        <v-list-item
          two-line
        >
          <v-list-item-avatar>
            <img
              src="../../src/assets/icon.png"
              alt="Starkiller Icon"
            >
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>Starkiller</v-list-item-title>
            <v-list-item-subtitle>{{ version }}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-icon>
            <v-btn
              icon
              @click.stop="toggle"
            >
              <v-icon>mdi-page-last</v-icon>
            </v-btn>
          </v-list-item-icon>
        </v-list-item>

        <v-divider />
        <v-list
          dense
          nav
        >
          <v-list-item
            v-for="item in items"
            :key="item.title"
            link
            :to="{ name: item.pathName }"
          >
            <v-list-item-icon>
              <v-icon :class="item.class">
                {{ item.icon }}
              </v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <!-- <v-list-item>
            <v-list-item-icon>
              <v-btn
                icon
                @click.stop="toggle"
              >
                <v-icon>mdi-page-last</v-icon>
              </v-btn>
            </v-list-item-icon>
          </v-list-item> -->
        </v-list>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script>
import { version } from '../../package.json';

export default {
  data() {
    return {
      version,
      mini: true,
      // expandOnHover: true,
      items: [
        { title: 'Listeners', pathName: 'listeners', icon: 'fa-headphones' },
        {
          title: 'Stagers', pathName: 'stagers', icon: 'fa-suitcase-rolling', class: 'pl-1',
        },
        { title: 'Agents', pathName: 'agents', icon: 'fa-link' },
        { title: 'Modules', pathName: 'modules', icon: 'fa-grip-horizontal' },
        { title: 'Obfuscation', pathName: 'obfuscation', icon: 'fa-magic' },
        { title: 'Credentials', pathName: 'credentials', icon: 'fa-key' },
        { title: 'Tasks', pathName: 'tasks', icon: 'fa-sticky-note' },
        { title: 'Malleable Profiles', pathName: 'malleableProfiles', icon: 'fa-random' },
        { title: 'Bypasses', pathName: 'bypasses', icon: 'fa-shield-virus' },
        { title: 'Plugins', pathName: 'plugins', icon: 'fa-plug' },
        { title: 'Downloads', pathName: 'downloads', icon: 'fa-download' },
        { title: 'Users', pathName: 'users', icon: 'fa-user' },
        { title: 'Settings', pathName: 'settings', icon: 'fa-cog' },
        { title: 'About', pathName: 'about', icon: 'fa-info-circle' },
      ],
    };
  },
  computed: {
    expandOnHover() {
      return this.mini;
    },
  },
  methods: {
    toggle() {
      this.mini = !this.mini;
    },
  },
};
</script>
