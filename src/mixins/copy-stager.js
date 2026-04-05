import { copyToClipboard } from "@/utils/clipboard";

export default {
  inject: ["snack"],
  methods: {
    /**
     * Copies stager output to clipboard
     * @param {*} output text to copy
     */
    async copyStager(output) {
      await copyToClipboard(output, this.snack);
    },
  },
};
