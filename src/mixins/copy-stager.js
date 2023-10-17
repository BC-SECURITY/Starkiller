export default {
  methods: {
    /**
     * Copies stager output to clipboard
     * @param {*} output text to copy
     */
    async copyStager(output) {
      try {
        await navigator.clipboard.writeText(output);
        this.$snack.success("Output copied to clipboard");
      } catch (error) {
        this.$snack.warn(
          "Failed to copy to clipboard. You must be on HTTPS or localhost.",
        );
      }
    },
  },
};
