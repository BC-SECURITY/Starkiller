export function useDownload() {
  /**
   * Downloads a stager file. No-ops if outFile is empty or its last path
   * segment is empty (e.g. a trailing slash), since there is no filename.
   * @param {string} output the base64 encoded file
   * @param {string} outFile the name of the file according to Empire
   */
  async function downloadStager(output, outFile) {
    const fileName = outFile.split("/")[outFile.split("/").length - 1];
    if (fileName.length === 0) {
      return;
    }

    // https://medium.com/@riccardopolacci/download-file-in-javascript-from-bytea-6a0c5bb3bbdb
    const binaryString = window.atob(output);
    const bytes = new Uint8Array(binaryString.length);
    const arrayBuffer = bytes.map((byte, i) => binaryString.charCodeAt(i));
    const blob = new Blob([arrayBuffer]);
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Downloads arbitrary text as a plain-text file.
   * @param {string} output the text content to download
   * @param {string} fileName the name to save the file as
   */
  async function downloadText(output, fileName) {
    const blob = new Blob([output], { type: "text/plain" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return { downloadStager, downloadText };
}
