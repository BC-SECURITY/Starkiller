<template>
  <div>
    <v-expansion-panels v-if="hasInfo" class="collapse">
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ info.description }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div style="text-align: left">
            <div style="margin-bottom: 10px">
              <b class="mr-2">Authors:</b>
              <author-chips :authors="info.authors" />
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
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import AuthorChips from "@/components/AuthorChips.vue";

export default {
  name: "InfoViewer",
  components: {
    AuthorChips,
  },
  props: {
    info: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    // Only render when there is real content to show. The template objects are
    // initialized to `{ options: {} }`, so listenerInfo/stagerInfo yield an
    // object with description/authors/comments keys whose values are all
    // undefined until a template is actually selected — a plain key-count check
    // would treat that as "has info" and render an empty, titleless panel.
    hasInfo() {
      const { description, authors, comments, extraDetails } = this.info || {};
      return Boolean(
        description ||
          authors?.length ||
          comments?.length ||
          extraDetails?.length,
      );
    },
  },
};
</script>

<style lang="scss" scoped>
.collapse {
  margin-bottom: 25px;
}
</style>
