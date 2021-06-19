<template>
  <div>
    <v-icon
      v-if="loading"
      style="width: 50px;"
      class="fa-3x fas fa-spinner fa-spin"
    />
    <v-treeview
      ref="treeview"
      dense
      hoverable
      open-on-click
      item-key="id"
      :load-children="debouncedLoadChildren"
      :open.sync="open"
      :items="tree"
    >
      <template #label="{ item, open }">
        <v-btn
          style="margin-left: -15px; width: 100%;"
          class="text-left"
          text
          @contextmenu="show(item, $event)"
        >
          <div style="display: flex; justify-content: fle -start;">
            <v-icon v-if="!item.file">
              {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
            </v-icon>
            <v-icon v-else>
              {{ files[item.file] || 'mdi-file' }}
            </v-icon>
            <span class="ml-2">{{ item.name }}</span>
          </div>
        </v-btn>
      </template>
    </v-treeview>
    <v-menu
      v-model="showMenu"
      :position-x="menuPosition.x"
      :position-y="menuPosition.y"
      close-on-content-click
      absolute
      offset-y
    >
      <v-list>
        <v-list-item
          v-for="menuItem in menuItems"
          :key="menuItem.id"
          @click="clickAction(menuItem.id)"
        >
          <v-list-item-content>{{ menuItem.name }}</v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import Vue from 'vue';
import * as agentApi from '@/api/agent-api';
import debounce from 'lodash.debounce';

export default {
  props: {
    agentName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      /**
       * Can add more common extensions here for icon prettiness.
       */
      files: {
        html: 'mdi-language-html5',
        js: 'mdi-nodejs',
        json: 'mdi-json',
        md: 'mdi-markdown',
        pdf: 'mdi-file-pdf',
        png: 'mdi-file-image',
        txt: 'mdi-file-document-outline',
        xls: 'mdi-file-excel',
        xlsx: 'mdi-file-excel',
        ppt: 'mdi-file-powerpoint',
        pptx: 'mdi-file-powerpoint',
        jpg: 'mdi-file-image',
        jpeg: 'mdi-file-image',
        doc: 'mdi-file-word',
        docx: 'mdi-file-word',
      },
      /**
       * File nodes.
       */
      tree: [],
      /**
       * Ids of open directories.
       */
      open: [],
      showMenu: false,
      menuPosition: {
        x: 0,
        y: 0,
      },
      /**
       * The selected node. Used for the menu.
       */
      selected: {},
      /**
       * A cache for whether the loadChildren method should be forced to run.
       * This is useful for refreshes.
       * TODO: This may just be an artifact of the many refactors. See if its still needed.
       */
      force: {},
      /**
       * Used to reduce duplicate calls to loadChildren from the refresh method.
       * A side effect of the hackiness.
       */
      currentlyLoading: {},
      /**
       * The initial page loading.
       */
      loading: false,
      /**
       * Debounced call to loadChildren to reduce the duplicate calls.
       * I'll admit I don't love the code on this page, but it at least functions a lot better
       * with the debounce and caches.
       */
      debouncedLoadChildren: null,
    };
  },
  computed: {
    menuItems() {
      return [{
        id: 'close',
        name: 'Close',
        fileOption: false,
        folderOption: true,
      }, {
        id: 'open',
        name: 'Open',
        fileOption: false,
        folderOption: true,
      }, {
        id: 'refresh',
        name: 'Refresh',
        fileOption: false,
        folderOption: true,
      }, {
        id: 'download',
        name: 'Download to Empire',
        fileOption: true,
        folderOption: false,
      }].filter((el) => {
        if (this.selected.file) {
          return el.fileOption === true;
        }
        return el.folderOption === true;
      }).filter((el) => {
        if (el.id === 'open') {
          if (this.open.find((id) => id === this.selected.id)) {
            return false;
          }
        } else if (el.id === 'close' || el.id === 'refresh') {
          if (!this.open.find((id) => id === this.selected.id)) {
            return false;
          }
        }

        return true;
      });
    },
  },
  async mounted() {
    this.debouncedLoadChildren = debounce(this.loadChildren, 500, { leading: true });

    this.loading = true;
    try {
      const items = await agentApi.getDirectory(this.agentName, '/');
      this.tree = items.map((el) => this.transform(el));
    } catch (err) { // directory not found.
      const task = await this.scrapeDirectory('/');

      let i = 0;
      let complete = 0;
      while (i < 10) {
        // eslint-disable-next-line no-await-in-loop
        await this.pause(6000);
        // eslint-disable-next-line no-await-in-loop
        if (await this.checkTaskComplete(task.taskID)) {
          complete = true;
          break;
        }
        i++;
      }

      if (!complete) {
        this.$snack.error('Agent didn\'t respond in time. Please try again later.');
      }

      this.tree = (await agentApi.getDirectory(this.agentName, '/')).map((el) => this.transform(el));
    }
    this.loading = false;
  },
  methods: {
    async clickAction(action) {
      if (action === 'open') {
        this.open.push(this.selected.id);
      } else if (action === 'close') {
        this.open.splice(this.open.findIndex((id) => id === this.selected.id), 1);
      } else if (action === 'refresh') {
        // Hackiness to get refreshes to work properly. Have to force the node to think it hasn't
        // been loaded.
        this.selected.children = [];
        const vueObj = this.$refs.treeview.$children.filter((el) => el.key === this.selected.id);
        this.open.splice(this.open.findIndex((id) => id === this.selected.id), 1);

        await Vue.nextTick();

        vueObj[0].hasLoaded = false;
        this.force[this.selected.id] = true;
        this.open.push(this.selected.id);
      } else if (action === 'download') {
        agentApi.downloadFile(this.agentName, this.selected.path);
        this.$snack.success(`Tasked ${this.agentName} for download ${this.selected.path}`);
      } else {
        // do nothing
      }
    },
    show(item, e) {
      e.preventDefault();
      this.showMenu = false;
      this.menuPosition.x = e.clientX;
      this.menuPosition.y = e.clientY;
      this.selected = item;

      this.$nextTick(() => {
        this.showMenu = true;
      });
    },
    transform(serverElement) {
      return {
        file: serverElement.is_file === true ? serverElement.name.split('.').pop() : false,
        children: serverElement.is_file === false ? [] : undefined,
        ...serverElement,
      };
    },
    pause(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    async loadChildren(a, { stopTrying } = {}) {
      if (this.currentlyLoading[a.id]) return Promise.resolve();

      this.currentlyLoading[a.id] = true;
      const files = await agentApi.getDirectory(this.agentName, a.path);
      if (!this.force[a.id] && files.length > 0) {
        this.removeFromCurrentlyLoading(a.id);
        // eslint-disable-next-line no-param-reassign
        a.children = files.map((el) => this.transform(el));
        return Promise.resolve();
      } if (!stopTrying) {
        this.$snack.success(`Attempting to retrieve directory: ${a.path}`);
        const task = await this.scrapeDirectory(a.path);

        let i = 0;
        let complete = false;
        while (i < 10) {
        // eslint-disable-next-line no-await-in-loop
          await this.pause(6000);
          // eslint-disable-next-line no-await-in-loop
          if (await this.checkTaskComplete(task.taskID)) {
            console.log('task complete', task.taskID);
            complete = true;
            break;
          }
          i++;
        }

        if (!complete) {
          this.$snack.error('Agent didn\'t respond in time. Please try again later.');
        }

        this.removeFromForce(a.id);
        this.removeFromCurrentlyLoading(a.id);
        return Promise.resolve(this.loadChildren(a, { stopTrying: true }));
      }
      this.removeFromForce(a.id);
      this.removeFromCurrentlyLoading(a.id);
      return Promise.resolve();
    },
    removeFromForce(id) {
      if (this.force[id]) delete this.force[id];
    },
    removeFromCurrentlyLoading(id) {
      if (this.currentlyLoading[id]) delete this.currentlyLoading[id];
    },
    async scrapeDirectory(path) {
      return agentApi.scrapeDirectory(this.agentName, path);
    },
    async checkTaskComplete(taskId) {
      try {
        const task = await agentApi.getTask(this.agentName, taskId);
        if (task.results) {
          return true;
        }

        return false;
      } catch (err) {
        return false;
      }
    },
  },
};
</script>

<style lang="scss">
.v-treeview {
  .v-btn__content {
    div {
      align-items: center;
    }
    justify-content: left;
  }
}
</style>
