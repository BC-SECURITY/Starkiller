<template>
  <div>
    <div
      :class="fileName.length === 0 ? 'clipboard-header point' : 'clipboard-header'"
      @click="copyToClipboard"
    >
      <h3>Generated Stager</h3>
      <i
        v-if="fileName.length === 0"
        class="el-icon-paperclip center-icon"
      />
    </div>
    <el-input
      v-if="fileName.length === 0"
      v-model="output"
      readonly
      type="textarea"
      :autosize="{ minRows: 2, maxRows: 10 }"
    />
    <el-input
      v-if="fileName.length > 0"
      v-model="fileName"
      readonly
      type="text"
    />
    <el-button
      v-if="outFile.length > 0"
      @click="outfileToDownload"
    >
      Download
    </el-button>
  </div>
</template>

<script>
import DownloadMixin from '@/mixins/download-stager';
import CopyMixin from '@/mixins/copy-stager';

export default {
  mixins: [DownloadMixin, CopyMixin],
  props: {
    outFile: {
      type: String,
      default: '',
    },
    output: {
      type: String,
      default: '',
    },
  },
  computed: {
    fileName() {
      return this.outFile.split('/')[this.outFile.split('/').length - 1];
    },
  },
  methods: {
    async copyToClipboard() {
      this.copyStager(this.output);
    },
    async outfileToDownload() {
      return this.downloadStager(this.output, this.outFile);
    },
  },
};
</script>

<style scoped>
.clipboard-header {
  display: flex;
  flex-direction: row;
}

.point:hover {
  cursor: pointer;
}

.center-icon {
  align-self: center;
}
</style>
