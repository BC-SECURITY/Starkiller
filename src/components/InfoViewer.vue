<template>
  <div>
    <v-expansion-panels class="collapse">
      <v-expansion-panel :disabled="infoArray.length < 1">
        <v-expansion-panel-header v-if="infoArray.length > 0">
          {{ infoArray[0].key }}: {{ infoArray[0].value }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <div style="text-align: left;">
            <div
              v-for="(item, index) in infoArray"
              :key="index"
              style="margin-bottom: 10px"
            >
              <span v-if="index > 0"><b>{{ item.key }}:</b> {{ item.value }}</span>
            </div>
          </div>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
export default {
  props: {
    infoArray: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style lang="scss" scoped>
.collapse {
  margin-bottom: 25px;
}
</style>
