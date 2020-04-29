<template>
  <div>
    <v-navigation-drawer
      app
      permanent
      expand-on-hover
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
            <img src="https://raw.githubusercontent.com/BC-SECURITY/Starkiller/master/src/assets/icon.png">
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>Starkiller</v-list-item-title>
            <v-list-item-subtitle>v1.2.0</v-list-item-subtitle>
          </v-list-item-content>
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
              <v-icon :class="item.class">{{ item.icon }}</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script>
export default {
  data() {
    return {
      miniVariant: false,
      items: [
        { title: 'Listeners', pathName: 'listeners', icon: 'fa-headphones' },
        {
          title: 'Stagers', pathName: 'stagers', icon: 'fa-suitcase-rolling', class: 'pl-1',
        },
        { title: 'Agents', pathName: 'agents', icon: 'fa-link' },
        { title: 'Modules', pathName: 'modules', icon: 'fa-grip-horizontal' },
        { title: 'Credentials', pathName: 'credentials', icon: 'fa-key' },
        { title: 'Reporting', pathName: 'reporting', icon: 'fa-sticky-note' },
        { title: 'Users', pathName: 'users', icon: 'fa-user' },
        { title: 'Settings', pathName: 'settings', icon: 'fa-cog' },
        { title: 'About', pathName: 'about', icon: 'fa-info-circle' },
      ],
    };
  },
};
</script>
