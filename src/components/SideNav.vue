<template>
  <div>
    <!-- I drew some inspiration for the sidenav from -->
    <!-- https://dribbble.com/shots/22474831-Dashboard-Sidebar-Navigation-Taurus -->
    <v-navigation-drawer permanent :rail="mini">
      <v-list v-model:opened="openedGroups" density="compact" nav>
        <v-list-item class="px-0">
          <template #prepend>
            <v-avatar size="40">
              <v-img :src="iconSrc" alt="Starkiller Icon" cover />
            </v-avatar>
          </template>

          <template v-if="!mini">
            <v-list-item-title>Starkiller: {{ version }}</v-list-item-title>
            <v-list-item-subtitle
              >Empire: {{ empireVersion }}</v-list-item-subtitle
            >
          </template>
          <template v-if="!mini" #append>
            <v-btn variant="text" icon @click.stop="toggle">
              <v-icon>mdi-page-first</v-icon>
            </v-btn>
          </template>
        </v-list-item>
        <div v-if="mini" class="d-flex justify-center py-1">
          <v-btn variant="text" icon size="small" @click.stop="toggle">
            <v-icon>mdi-page-last</v-icon>
          </v-btn>
        </div>
        <v-divider class="pb-3" />

        <template v-for="item in items" :key="item.title">
          <!-- If there are no subItems, just a regular v-list-item is used -->
          <!-- for mini and full -->
          <v-list-item v-if="!item.items" link :to="{ name: item.pathName }">
            <template #prepend>
              <v-icon>{{ item.icon }}</v-icon>
            </template>
            <v-list-item-title>
              {{ item.title }}
            </v-list-item-title>
          </v-list-item>
          <!-- If there are subItems and in full mode, us a list group -->
          <v-list-group v-else-if="item.items && !mini" :value="item.title">
            <template #activator="{ props: activatorProps }">
              <v-list-item v-bind="activatorProps" :prepend-icon="item.icon">
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </v-list-item>
            </template>
            <v-list-item
              v-for="subItem in item.items"
              :key="subItem.title"
              link
              :to="{ name: subItem.pathName }"
              class="pl-4 sub-item"
            >
              <template #prepend>
                <v-icon>{{ subItem.icon }}</v-icon>
              </template>
              <v-list-item-title>
                {{ subItem.title }}
              </v-list-item-title>
            </v-list-item>
          </v-list-group>

          <!-- If there are subItems and in mini mode, use a menu on hover -->
          <v-menu
            v-else
            v-model="menu[item.title]"
            open-on-hover
            transition="scale-transition"
            close-delay="150"
            location="end"
          >
            <template #activator="{ props: activatorProps }">
              <v-list-item
                v-bind="activatorProps"
                :active="isGroupActive(item)"
              >
                <template #prepend>
                  <v-icon>{{ item.icon }}</v-icon>
                </template>
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </v-list-item>
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="subItem in item.items"
                :key="subItem.title"
                link
                :to="{ name: subItem.pathName }"
                class="pl-8 sub-item"
              >
                <template #prepend>
                  <v-icon>{{ subItem.icon }}</v-icon>
                </template>
                <v-list-item-title>
                  {{ subItem.title }}
                </v-list-item-title>
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
import iconSrc from "@/assets/icon.png";
import { version } from "../../package.json";

export default {
  data() {
    return {
      version,
      iconSrc,
      menu: {},
      mini: true,
      openedGroups: [],
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
  },
  watch: {
    "$route.name": {
      immediate: true,
      handler() {
        this.updateOpenedGroups();
      },
    },
    mini() {
      this.updateOpenedGroups();
    },
  },
  methods: {
    toggle() {
      this.mini = !this.mini;
    },
    isGroupActive(item) {
      if (!item.items) return false;
      return item.items.some((subItem) => {
        const resolved = this.$router.resolve({ name: subItem.pathName });
        return this.$route.path.startsWith(resolved.path);
      });
    },
    updateOpenedGroups() {
      if (this.mini) return;
      const activeGroups = this.items
        .filter((item) => this.isGroupActive(item))
        .map((item) => item.title);
      if (
        activeGroups.length > 0 &&
        !activeGroups.every((g) => this.openedGroups.includes(g))
      ) {
        this.openedGroups = [
          ...new Set([...this.openedGroups, ...activeGroups]),
        ];
      }
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

.v-list-item__prepend > .v-icon {
  justify-content: center;
  width: 27px;
  min-width: 27px;
}

.v-navigation-drawer .v-icon {
  width: 27px;
  height: 24px;
}
</style>
