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
        </v-expansion-panel-content>
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
      default: () => {},
    },
  },
};
</script>

<style lang="scss" scoped>
.collapse {
  margin-bottom: 25px;
}
</style>
