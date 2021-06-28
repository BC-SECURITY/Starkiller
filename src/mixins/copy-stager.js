export default {
  methods: {
    /**
     * Copies stager output to clipboard
     * @param {*} output text to copy
     */
    async copyStager(output) {
      await navigator.clipboard.writeText(output);
      this.$snack.success('Output copied to clipboard');
    },
  },
};
