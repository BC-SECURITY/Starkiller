export default {
  methods: {
    /**
     * Copies stager output to clipboard
     * @param {*} output text to copy
     */
    async copyStager(output) {
      await navigator.clipboard.writeText(output);
      this.$toast.success('Output copied to clipboard');
    },
  },
};
