<template>
  <div>
    <!--  TODO Should use the same pagination as the server-side paging tables  -->
    <v-data-table
      v-model="selected"
      :loading="listenersStatus === 'loading'"
      :headers="headers"
      :items="sortedListeners"
      :footer-props="{
        itemsPerPageOptions: [5, 10, 15, 20, 50, 100],
      }"
      :items-per-page="15"
      item-key="id"
      dense
      show-select
    >
      <template #item.enabled="{ item }">
        <v-badge dot :color="item.enabled === true ? 'green' : 'red'" />
      </template>
      <template #item.name="{ item }">
        <router-link
          style="color: inherit"
          :to="{ name: 'listenerEdit', params: { id: item.id } }"
        >
          {{ item.name }}
        </router-link>
      </template>
      <template #item.created_at="{ item }">
        <date-time-display :timestamp="item.created_at" />
      </template>
      <template #item.tags="{ item }">
        <tag-viewer
          :tags="item.tags"
          @update-tag="updateTag(item, ...arguments)"
          @delete-tag="deleteTag(item, ...arguments)"
          @new-tag="addTag(item, ...arguments)"
        />
      </template>
      <template #item.actions="{ item }">
        <v-menu offset-y>
          <template #activator="{ on, attrs }">
            <v-btn text icon x-small v-bind="attrs" v-on="on">
              <v-icon>fa-ellipsis-v</v-icon>
            </v-btn>
          </template>
          <v-list class="ml-2 mr-2">
            <v-list-item key="view" link>
              <router-link
                class="text-decoration-none"
                style="color: inherit"
                :to="{ name: 'listenerEdit', params: { id: item.id } }"
              >
                <v-list-item-title>
                  <v-icon>fa-binoculars</v-icon>
                  View
                </v-list-item-title>
              </router-link>
            </v-list-item>
            <v-list-item
              key="copy"
              :to="{ name: 'listenerNew', params: { copy: true, id: item.id } }"
              link
            >
              <v-list-item-title>
                <v-icon>fa-clone</v-icon>
                Copy
              </v-list-item-title>
            </v-list-item>
            <v-divider class="pb-4" />
            <v-list-item key="delete" link @click="killListener(item)">
              <v-list-item-title>
                <v-icon>fa-trash-alt</v-icon>
                Delete
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import moment from "moment";
import TagViewer from "@/components/TagViewer.vue";
import DateTimeDisplay from "@/components/DateTimeDisplay.vue";
import * as listenerApi from "@/api/listener-api";
import { useListenerStore } from "@/stores/listener-module";

export default {
  name: "ListenersTable",
  components: {
    DateTimeDisplay,
    TagViewer,
  },
  props: {
    input: {
      type: Array,
      default: () => [],
    },
    selectedTags: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      moment,
      headers: [
        {
          text: "",
          align: "start",
          sortable: false,
          width: "5px",
          value: "enabled",
        },
        { text: "Name", value: "name" },
        { text: "Template", value: "template" },
        { text: "Host", value: "options.Host" },
        { text: "Port", value: "options.Port" },
        { text: "Created At", value: "created_at" },
        { text: "Tags", value: "tags", sortable: false },
        { text: "Actions", value: "actions", sortable: false },
      ],
      selected: [],
    };
  },
  computed: {
    listenerStore() {
      return useListenerStore();
    },
    listenersStatus() {
      return this.listenerStore.status;
    },
    sortedListeners() {
      let sorted = this.listenerStore.listeners.slice();

      if (this.selectedTags.length === 0) {
        return sorted;
      }

      sorted = sorted.filter((agent) => {
        const agentTags = agent.tags.map((tag) => `${tag.name}:${tag.value}`);
        return agentTags.some((tag) => this.selectedTags.includes(tag));
      });

      return sorted;
    },
  },
  watch: {
    selectedTags() {
      this.getListeners();
    },
    selected(val) {
      this.$emit("input", val);
    },
  },
  mounted() {
    this.getListeners();
  },
  methods: {
    deleteTag(listener, tag) {
      listenerApi
        .deleteTag(listener.id, tag.id)
        .then(() => {
          listener.tags = listener.tags.filter((t) => t.id !== tag.id);
          this.$emit("refresh-tags");
        })
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    updateTag(listener, tag) {
      listenerApi
        .updateTag(listener.id, tag)
        .then((t) => {
          const index = listener.tags.findIndex((x) => x.id === t.id);
          listener.tags.splice(index, 1, t);
          this.$emit("refresh-tags");
          this.$snack.success("Tag updated");
        })
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    addTag(listener, tag) {
      listenerApi
        .addTag(listener.id, tag)
        .then((t) => {
          listener.tags.push(t);
          this.$emit("refresh-tags");
        })
        .catch((err) => this.$snack.error(`Error: ${err}`));
    },
    async killListener(item) {
      this.$emit("kill-listener", item);
    },
    getListeners() {
      this.listenerStore.getListeners();
    },
  },
};
</script>

<style></style>
