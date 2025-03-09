<template>
  <div>
    <!-- I drew some inspiration for the sidenav from -->
    <!-- https://dribbble.com/shots/22474831-Dashboard-Sidebar-Navigation-Taurus -->
    <!-- Future improvements -->
    <!-- When mini, parent menu item should be selected -->
    <!-- Agents/{id} should also trigger the active submenu -->
    <v-navigation-drawer app permanent :mini-variant="mini">
      <v-list dense nav>
        <v-list-item class="px-0">
          <v-list-item-avatar>
            <img src="../../src/assets/icon.png" alt="Starkiller Icon" />
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>Starkiller: {{ version }}</v-list-item-title>
            <v-list-item-subtitle
              >Empire: {{ empireVersion }}</v-list-item-subtitle
            >
          </v-list-item-content>
          <v-list-item-icon>
            <v-btn icon @click.stop="toggle">
              <v-icon>mdi-page-first</v-icon>
            </v-btn>
          </v-list-item-icon>
        </v-list-item>
        <v-list-item v-if="mini">
          <v-list-item-icon>
            <v-btn icon @click.stop="toggle">
              <v-icon>mdi-page-last</v-icon>
            </v-btn>
          </v-list-item-icon>
        </v-list-item>
        <v-divider class="pb-3" />

        <template v-for="item in items">
          <!-- If there are no subItems, just a regular v-list-item is used -->
          <!-- for mini and full -->
          <v-list-item
            v-if="!item.items"
            :key="item.title"
            link
            :to="{ name: item.pathName }"
          >
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ item.title }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <!-- If there are subItems and in full mode, us a list group -->
          <v-list-group
            v-else-if="item.items && !mini"
            :key="item.title + 'group'"
            :value="isActiveGroup(item)"
          >
            <template #activator>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </template>
            <template #prependIcon>
              <v-icon>{{ item.icon }}</v-icon>
            </template>
            <v-list-item
              v-for="subItem in item.items"
              :key="subItem.title"
              link
              :to="{ name: subItem.pathName }"
              class="pl-4 sub-item"
            >
              <v-list-item-icon>
                <v-icon>{{ subItem.icon }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ subItem.title }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-group>

          <!-- If there are subItems and in mini mode, use a menu on hover -->
          <v-menu
            v-else
            :key="item.title + 'mini'"
            v-model="menu[item.title]"
            open-on-hover
            transition="scale-transition"
            close-delay="1"
            right
            offset-x
          >
            <template #activator="{ on, attrs }">
              <v-list-item
                v-bind="attrs"
                :value="isActiveGroup(item)"
                v-on="on"
              >
                <template #activator>
                  <v-list-item-title>{{ item.title }}</v-list-item-title>
                </template>
                <v-list-item-icon>
                  <v-icon>{{ item.icon }}</v-icon>
                </v-list-item-icon>
              </v-list-item>
            </template>
            <v-list dense>
              <v-list-item
                v-for="subItem in item.items"
                :key="subItem.title"
                link
                :to="{ name: subItem.pathName }"
                class="pl-8 sub-item"
              >
                <v-list-item-icon>
                  <v-icon>{{ subItem.icon }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ subItem.title }}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script>
import { mapState } from "pinia";
import { useApplicationStore } from "@/stores/application-module";
import { version } from "../../package.json";

export default {
  data() {
    return {
      version,
      menu: {},
      mini: true,
      items: [
        {
          title: "Listeners",
          icon: "fa-server",
          items: [
            {
              title: "Listeners",
              pathName: "listeners",
              icon: "fa-server",
            },
            {
              title: "Malleable Profiles",
              pathName: "malleableProfiles",
              icon: "fa-random",
            },
          ],
        },
        {
          title: "Stagers",
          icon: "fa-box-open",
          items: [
            {
              title: "Stagers",
              pathName: "stagers",
              icon: "fa-box-open",
            },
            {
              title: "Bypasses",
              pathName: "bypasses",
              icon: "fa-shield-virus",
            },
          ],
        },
        {
          title: "Agents",
          icon: "fa-link",
          items: [
            {
              title: "Agents",
              pathName: "agents",
              icon: "fa-link",
            },
            {
              title: "Agent Tasks",
              pathName: "agentTasks",
              icon: "fa-tasks",
            },
            {
              title: "Modules",
              pathName: "modules",
              icon: "fa-grip-horizontal",
            },
          ],
        },
        { title: "Obfuscation", pathName: "obfuscation", icon: "fa-mask" },
        { title: "Credentials", pathName: "credentials", icon: "fa-key" },
        { title: "Downloads", pathName: "downloads", icon: "fa-download" },
        {
          title: "Plugins",
          icon: "fa-puzzle-piece",
          items: [
            {
              title: "Installed Plugins",
              pathName: "plugins",
              icon: "fa-check",
            },
            {
              title: "Plugin Tasks",
              pathName: "pluginTasks",
              icon: "fa-tasks",
            },
            {
              title: "Marketplace",
              pathName: "pluginMarketplace",
              icon: "fa-store",
            },
          ],
        },
        {
          title: "Admin",
          icon: "fa-user-shield",
          items: [
            { title: "Users", pathName: "users", icon: "fa-user" },
            { title: "Settings", pathName: "settings", icon: "fa-cog" },
            { title: "About", pathName: "about", icon: "fa-info-circle" },
          ],
        },
        { title: "Notifications", pathName: "notifications", icon: "fa-bell" },
      ],
    };
  },
  computed: {
    ...mapState(useApplicationStore, ["empireVersion"]),
    isActiveGroup() {
      return (group) =>
        !this.mini &&
        group.items.some((subItem) => subItem.pathName === this.$route.name);
    },
  },
  methods: {
    toggle() {
      this.mini = !this.mini;
    },
  },
};
</script>

<style lang="scss">
.sub-item {
  background-color: rgba(0, 0, 0, 0.3);
}

.sub-item:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.v-list-item__icon {
  justify-content: center;
  width: 27px;
  min-width: 27px;
}

.v-icon {
  width: 27px;
  height: 24px;
}
</style>
