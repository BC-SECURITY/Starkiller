export default {
  methods: {
    /**
     * Downloads a stager file.
     * @param {*} output the base64 encoded file
     * @param {*} outFile the name of the file according to Empire
     */
    async downloadStager(output, outFile) {
      const fileName = outFile.split('/')[outFile.split('/').length - 1];
      if (fileName.length === 0) {
        return;
      }

      // https://medium.com/@riccardopolacci/download-file-in-javascript-from-bytea-6a0c5bb3bbdb
      if (outFile.length > 0) {
        const binaryString = window.atob(output);
        const bytes = new Uint8Array(binaryString.length);
        const arrayBuffer = bytes.map((byte, i) => binaryString.charCodeAt(i));
        const blob = new Blob([arrayBuffer]);
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    async downloadText(output, fileName) {
      const blob = new Blob([output], { type: 'text/plain' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  },
};
