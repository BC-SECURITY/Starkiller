import { inject } from "vue";
import { copyToClipboard } from "@/utils/clipboard";

export function useCopyStager() {
  const snack = inject("snack");

  /**
   * Copies stager output to clipboard
   * @param {string} output text to copy
   */
  async function copyStager(output) {
    await copyToClipboard(output, snack);
  }

  return { copyStager };
}
