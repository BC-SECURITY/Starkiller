// Pure derivation of the topline task counts from the two settled getTasks
// results (total + queued). Extracted from AgentStats so the degradation logic
// is unit-testable without mounting the component.
//
// Throws when the *total* leg failed or is malformed — the caller surfaces that
// (and the rejection's err.response.status drives the 404-terminal branch).
// The *queued* leg is decorative: a rejection or a fulfilled-but-shapeless
// response yields queued=null + queuedUnavailable=true so the tile can show
// "unavailable" rather than masquerading as zero.
export function deriveCounts(totalResp, queuedResp) {
  if (totalResp.status === "rejected") throw totalResp.reason;
  if (typeof totalResp.value?.total !== "number") {
    throw new Error("Task API did not return a total count");
  }

  let queued = null;
  let queuedUnavailable = false;
  if (
    queuedResp.status === "fulfilled" &&
    typeof queuedResp.value?.total === "number"
  ) {
    queued = queuedResp.value.total;
  } else {
    queuedUnavailable = true;
    if (queuedResp.status === "rejected") {
      // eslint-disable-next-line no-console
      console.warn("[AgentStats] queued count unavailable", queuedResp.reason);
    }
  }

  return { total: totalResp.value.total, queued, queuedUnavailable };
}
