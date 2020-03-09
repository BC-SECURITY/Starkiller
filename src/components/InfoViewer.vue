<template>
  <div>
    <el-collapse class="collapse">
      <el-collapse-item :disabled="infoArray.length < 1">
        <template slot="title">
          <span v-if="infoArray.length > 0">{{ infoArray[0].key }}: {{ infoArray[0].value }}</span>
        </template>
        <div style="text-align: left;">
          <div
            v-for="(item, index) in infoArray"
            :key="index"
          >
            <span v-if="index > 0"><b>{{ item.key }}:</b> {{ item.value }}</span>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
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
