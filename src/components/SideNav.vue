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
            :to="item.title"
          >
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
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
        { title: 'Listeners', icon: 'fa-headphones' },
        { title: 'Stagers', icon: 'fa-suitcase-rolling' },
        { title: 'Agents', icon: 'fa-link' },
        { title: 'Modules', icon: 'fa-grip-horizontal' },
        { title: 'Credentials', icon: 'fa-key' },
        { title: 'Reporting', icon: 'fa-sticky-note' },
        { title: 'Users', icon: 'fa-user' },
        { title: 'Settings', icon: 'fa-cog' },
        { title: 'About', icon: 'fa-info-circle' },
      ],
    };
  },
};
</script>
