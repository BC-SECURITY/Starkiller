<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="true"
      :show-refresh="true"
      :show-delete="showDelete"
      @create="create"
      @refresh="getCredentials"
      @delete="deleteCredentials"
    />
    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="credentials"
      item-key="ID"
      dense
      show-select
    >
      <template #item.ID="{ item }">
        <router-link
          style="color: inherit;"
          :to="{ name: 'credentialEdit', params: { id: item.ID }}"
        >
          {{ item.ID }}
        </router-link>
      </template>
      <template #item.username="{ item }">
        <div
          class="point"
          @click="copyToClipboard(item.username)"
        >
          {{ item.username }}
          <i class="fa fa-paperclip center-icon" />
        </div>
      </template>
      <template #item.password="{ item }">
        <div
          class="point"
          @click="copyToClipboard(item.password)"
        >
          {{ item.password }}
          <i class="fa fa-paperclip center-icon" />
        </div>
      </template>
      <template #item.actions="{ item }">
        <v-menu offset-y>
          <template #activator="{ on, attrs }">
            <v-btn
              text
              icon
              x-small
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>fa-ellipsis-v</v-icon>
            </v-btn>
          </template>
          <v-list class="ml-2 mr-2">
            <v-list-item
              key="edit"
              link
            >
              <router-link
                class="text-decoration-none"
                style="color: inherit;"
                :to="{ name: 'credentialEdit', params: { id: item.ID }}"
              >
                <v-list-item-title>
                  <v-icon>fa-pencil-alt</v-icon>
                  Edit
                </v-list-item-title>
              </router-link>
            </v-list-item>
            <v-list-item
              key="copy"
              link
            >
              <router-link
                class="text-decoration-none"
                style="color: inherit;"
                :to="{ name: 'credentialNew', params: { copy: true, id: item.ID } }"
              >
                <v-list-item-title>
                  <v-icon>fa-clone</v-icon>
                  Copy
                </v-list-item-title>
              </router-link>
            </v-list-item>
            <v-divider class="pb-4" />
            <v-list-item
              key="delete"
              link
              @click="deleteCredential(item)"
            >
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
import { mapState } from 'vuex';
import ListPageTop from '@/components/ListPageTop.vue';

export default {
  name: 'Credentials',
  components: {
    ListPageTop,
  },
  data() {
    return {
      breads: [
        {
          text: 'Credentials',
          disabled: true,
          href: '/credentials',
        },
      ],
      headers: [
        { text: 'id', value: 'ID' },
        { text: 'CredType', value: 'credtype' },
        { text: 'Username', value: 'username' },
        { text: 'Password', value: 'password' },
        { text: 'Domain', value: 'domain' },
        { text: 'Host', value: 'host' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      selected: [],
    };
  },
  computed: {
    ...mapState({
      credentials: (state) => state.credential.credentials,
    }),
    showDelete() {
      return this.selected.length > 0;
    },
  },
  mounted() {
    this.getCredentials();
  },
  methods: {
    getCredentials() {
      this.$store.dispatch('credential/getCredentials');
    },
    create() {
      this.$router.push({ name: 'credentialNew' });
    },
    async deleteCredential(item) {
      if (await this.$root.$confirm('Delete', `Are you sure you want to delete credential ${item.ID}?`, { color: 'red' })) {
        this.$store.dispatch('credential/deleteCredential', item.ID);
      }
    },
    async deleteCredentials() {
      if (await this.$root.$confirm('Delete', `Are you sure you want to delete ${this.selected.length} credentials?`, { color: 'red' })) {
        this.selected.forEach((credential) => {
          this.$store.dispatch('credential/deleteCredential', credential.ID);
        });
      }
    },
    async copyToClipboard(val) {
      await navigator.clipboard.writeText(val);
      this.$snack.success('Output copied to clipboard');
    },
  },
};
</script>

<style>
.point:hover {
  cursor: pointer;
}
</style>
