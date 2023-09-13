<template>
  <div>
    <v-expansion-panels
      :disabled="Object.keys(info).length < 1"
      class="collapse"
    >
      <v-expansion-panel>
        <v-expansion-panel-header v-if="Object.keys(info).length > 0">
          {{ info.description }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <div style="text-align: left">
            <div style="margin-bottom: 10px">
              <span>
                <b class="mr-2">Authors:</b>
                <template v-for="(author, index) in info.authors">
                  <v-chip
                    v-if="author.link"
                    :key="index"
                    medium
                    :href="author.link"
                    class="mr-1 mb-1"
                  >
                    {{ formatDisplayName(author) }}
                  </v-chip>

                  <v-chip
                    v-else
                    :key="index"
                    medium
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mr-1 mb-1"
                  >
                    {{ formatDisplayName(author) }}
                  </v-chip>
                </template>
              </span>
            </div>
            <div style="margin-bottom: 10px">
              <span>
                <b class="mr-2">Comments:</b>
                <ul>
                  <li v-for="(comment, index) in info.comments" :key="index">
                    {{ comment }}
                  </li>
                </ul>
              </span>
            </div>
          </div>
          <div
            v-for="detail in info.extraDetails"
            :key="detail.key"
            style="margin-bottom: 10px"
          >
            <span>
              <b>{{ detail.key }}:</b>
              {{ detail.value }}
            </span>
          </div>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
export default {
  props: {
    info: {
      type: Object,
      default: () => {},
    },
  },
  methods: {
    formatDisplayName(author) {
      if (author.name && author.handle) {
        return `${author.name} (${author.handle})`;
      }
      if (author.name) {
        return author.name;
      }
      if (author.handle) {
        return author.handle;
      }
      return "";
    },
  },
};
</script>

<style lang="scss" scoped>
.collapse {
  margin-bottom: 25px;
}
</style>
