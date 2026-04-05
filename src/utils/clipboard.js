// eslint-disable-next-line import/prefer-default-export
export async function copyToClipboard(text, snack) {
  try {
    await navigator.clipboard.writeText(text);
    snack.success("Copied to clipboard");
  } catch (error) {
    console.error("[Starkiller] Clipboard write failed:", error);
    snack.warn(
      "Failed to copy to clipboard. You must be on HTTPS or localhost.",
    );
  }
}
