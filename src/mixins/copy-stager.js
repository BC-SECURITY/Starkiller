export default {
  methods: {
    /**
     * Copies stager output to clipboard
     * @param {*} output text to copy
     */
    async copyStager(output) {
      try {
        await navigator.clipboard.writeText(output);
        this.$notify({
          title: 'Success',
          message: 'Output copied to clipboard',
          type: 'success',
        });
      } catch (e) {
        this.$notify.error({
          title: 'Error',
          message: 'Could not copy to clipboard',
        });
      }
    },
  },
};
