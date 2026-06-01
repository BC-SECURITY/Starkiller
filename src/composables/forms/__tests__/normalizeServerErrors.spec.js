import {
  normalizeServerErrors,
  normalizeSubmitError,
} from "@/composables/forms/normalizeServerErrors";

describe("normalizeServerErrors", () => {
  it("maps a 422 array item to its field via the first non-envelope loc segment", () => {
    const r = normalizeServerErrors(
      [{ loc: ["body", "options", "Name"], msg: "required" }],
      ["Name", "Port"],
    );
    expect(r.fields).toEqual({ Name: ["required"] });
    expect(r.formLevel).toEqual([]);
  });

  it("ignores trailing loc sub-paths and still resolves the field", () => {
    const r = normalizeServerErrors(
      [{ loc: ["body", "options", "Name", "value"], msg: "bad" }],
      ["Name"],
    );
    expect(r.fields).toEqual({ Name: ["bad"] });
  });

  it("routes an item whose field is not known to formLevel", () => {
    const r = normalizeServerErrors(
      [{ loc: ["body", "options", "Ghost"], msg: "huh" }],
      ["Name"],
    );
    expect(r.fields).toEqual({});
    expect(r.formLevel).toEqual(["huh"]);
  });

  it("routes an item with no usable loc to formLevel", () => {
    const r = normalizeServerErrors(
      [{ loc: ["body"], msg: "envelope only" }],
      ["Name"],
    );
    expect(r.formLevel).toEqual(["envelope only"]);
  });

  it("accumulates multiple messages for the same field", () => {
    const r = normalizeServerErrors(
      [
        { loc: ["body", "options", "Name"], msg: "a" },
        { loc: ["body", "options", "Name"], msg: "b" },
      ],
      ["Name"],
    );
    expect(r.fields.Name).toEqual(["a", "b"]);
  });

  it("puts a [*] string detail in formLevel", () => {
    expect(normalizeServerErrors("[*] bad listener", ["Name"])).toEqual({
      fields: {},
      formLevel: ["[*] bad listener"],
    });
  });

  it("prefers a string message key when an object detail has one", () => {
    const r = normalizeServerErrors(
      { message: "Internal server error", code: 500 },
      ["Name"],
    );
    expect(r.formLevel).toEqual(["Internal server error"]);
    expect(r.formLevel[0]).not.toContain("[object Object]");
  });

  it("falls through to JSON.stringify when no usable message key exists", () => {
    const r = normalizeServerErrors({ unexpected: true }, ["Name"]);
    expect(r.formLevel).toEqual(['{"unexpected":true}']);
    expect(r.formLevel[0]).not.toContain("[object Object]");
  });

  it("recognizes common alternate message keys", () => {
    expect(normalizeServerErrors({ error: "boom" }, []).formLevel).toEqual([
      "boom",
    ]);
    expect(normalizeServerErrors({ detail: "nope" }, []).formLevel).toEqual([
      "nope",
    ]);
    expect(normalizeServerErrors({ description: "bad" }, []).formLevel).toEqual(
      ["bad"],
    );
  });

  it("picks the highest-priority message key when several are present", () => {
    // message > error > detail > description. Pin the order so an
    // alphabetize-keys refactor silently changes which key wins.
    expect(
      normalizeServerErrors(
        { message: "m", error: "e", detail: "d", description: "x" },
        [],
      ).formLevel,
    ).toEqual(["m"]);
    expect(
      normalizeServerErrors({ error: "e", detail: "d" }, []).formLevel,
    ).toEqual(["e"]);
    expect(
      normalizeServerErrors({ detail: "d", description: "x" }, []).formLevel,
    ).toEqual(["d"]);
  });

  it("falls through an empty-string high-priority key to the next non-empty key", () => {
    // Pins both `.trim()` and the non-empty check in fallbackMessage. A
    // refactor to truthy-only (`if (item[key])`) would let "  " through and
    // render a whitespace-only banner; a defined-check would let "" through
    // and render blank — the exact silent-failure this work targets.
    expect(
      normalizeServerErrors({ message: "", error: "e" }, []).formLevel,
    ).toEqual(["e"]);
    expect(
      normalizeServerErrors({ message: "  ", error: "e" }, []).formLevel,
    ).toEqual(["e"]);
  });

  it("surfaces a generic message for an empty detail array instead of nothing", () => {
    const r = normalizeServerErrors([], ["Name"]);
    expect(r.fields).toEqual({});
    expect(r.formLevel).toHaveLength(1);
    expect(r.formLevel[0]).toMatch(/no details/i);
  });

  it("derives a readable message for a 422 item with no msg, using its type", () => {
    const r = normalizeServerErrors(
      [{ loc: ["body", "options", "Name"], type: "value_error" }],
      ["Name"],
    );
    expect(r.fields.Name).toEqual(["Validation error (value_error)"]);
    expect(r.fields.Name[0]).not.toContain("[object Object]");
  });

  it("routes a msg-only item with no loc to formLevel", () => {
    const r = normalizeServerErrors([{ msg: "no location given" }], ["Name"]);
    expect(r.fields).toEqual({});
    expect(r.formLevel).toEqual(["no location given"]);
  });

  it("falls back for an empty or whitespace-only string detail instead of a blank banner", () => {
    // Sibling guard to the Error and empty-array paths: a blank string detail
    // would otherwise push "" and render an empty prominent banner while the
    // snack stays gated off — the exact silent failure this work targets.
    expect(normalizeServerErrors("", ["Name"]).formLevel[0]).toMatch(
      /no details/i,
    );
    expect(normalizeServerErrors("   ", []).formLevel[0]).toMatch(
      /no details/i,
    );
  });

  it("falls back for a 422 item whose msg is empty or whitespace-only", () => {
    // A present-but-blank msg ("" / "  ") must not become a blank field error
    // (a red field with no explanatory text); it falls back to the item's type.
    const r = normalizeServerErrors(
      [{ loc: ["body", "options", "Name"], type: "value_error", msg: "  " }],
      ["Name"],
    );
    expect(r.fields.Name).toEqual(["Validation error (value_error)"]);
    expect(r.fields.Name[0].trim()).not.toBe("");
  });
});

describe("normalizeSubmitError", () => {
  const FALLBACK = "Operation failed.";

  it("wraps a raw Error's message in a single-item array for the banner", () => {
    const { serverError, snackText } = normalizeSubmitError(
      new Error("network down"),
      FALLBACK,
    );
    expect(serverError).toEqual(["network down"]);
    expect(snackText).toBe("network down");
  });

  it("uses the fallback when an Error has no message", () => {
    const err = new Error("");
    const { serverError, snackText } = normalizeSubmitError(err, FALLBACK);
    expect(serverError).toEqual([FALLBACK]);
    expect(snackText).toBe(FALLBACK);
  });

  it("preserves a pre-unwrapped 422 array detail and snacks the first item's msg", () => {
    const detail = [
      { loc: ["body", "options", "Name"], msg: "required" },
      { loc: ["body", "options", "Port"], msg: "out of range" },
    ];
    const { serverError, snackText } = normalizeSubmitError(detail, FALLBACK);
    expect(serverError).toBe(detail);
    expect(snackText).toBe("required");
  });

  it("preserves a string detail (e.g. [*] message) as-is", () => {
    const { serverError, snackText } = normalizeSubmitError(
      "[*] bad listener",
      FALLBACK,
    );
    expect(serverError).toBe("[*] bad listener");
    expect(snackText).toBe("[*] bad listener");
  });

  it("preserves an object detail and snacks the highest-priority message key", () => {
    const detail = { message: "Internal", error: "ignored", code: 500 };
    const { serverError, snackText } = normalizeSubmitError(detail, FALLBACK);
    expect(serverError).toBe(detail);
    expect(snackText).toBe("Internal");
  });

  it("snacks the fallback (not undefined) when detail is an empty array", () => {
    // Regression guard: previously an empty-array detail produced a silent
    // toast because text resolved to undefined.
    const { serverError, snackText } = normalizeSubmitError([], FALLBACK);
    expect(serverError).toEqual([]);
    expect(snackText).toBe(FALLBACK);
  });

  it("snacks the fallback when array first element is an opaque object", () => {
    // Previously this produced "[object Object]" in the toast.
    const detail = [{ weird: true }];
    const { serverError, snackText } = normalizeSubmitError(detail, FALLBACK);
    expect(serverError).toBe(detail);
    expect(snackText).toBe(FALLBACK);
  });

  it("snacks the fallback when an object detail has no recognizable message key", () => {
    const detail = { code: 500, status: "down" };
    const { serverError, snackText } = normalizeSubmitError(detail, FALLBACK);
    expect(serverError).toBe(detail);
    expect(snackText).toBe(FALLBACK);
  });

  it("uses the default fallback when no fallback is passed", () => {
    const { snackText } = normalizeSubmitError(new Error(""));
    expect(snackText).toBe("Operation failed.");
  });

  it("uses the fallback when err is null (defensive)", () => {
    const { snackText } = normalizeSubmitError(null, FALLBACK);
    expect(snackText).toBe(FALLBACK);
  });

  it("uses the fallback when err is undefined (defensive)", () => {
    const { snackText } = normalizeSubmitError(undefined, FALLBACK);
    expect(snackText).toBe(FALLBACK);
  });

  it("falls back when an Error's message is only whitespace", () => {
    // Pins .trim() before the truthy check — otherwise "   " is truthy and
    // would render a blank toast.
    const { serverError, snackText } = normalizeSubmitError(
      new Error("   "),
      FALLBACK,
    );
    expect(serverError).toEqual([FALLBACK]);
    expect(snackText).toBe(FALLBACK);
  });

  it("snacks the fallback when an object detail's message key is whitespace-only", () => {
    // Sibling to the banner-side test: summarizeForToast must reject
    // whitespace too, otherwise the toast renders as a blank fade.
    const detail = { message: "   ", error: "" };
    const { snackText } = normalizeSubmitError(detail, FALLBACK);
    expect(snackText).toBe(FALLBACK);
  });

  it("snacks a MESSAGE_KEYS value from an array first-element object", () => {
    // An array of objects without `msg` (just `message`/`error`/etc.) must be
    // walked by the toast path so it doesn't fall back to the generic while
    // the banner shows the value. extractMessage unifies both surfaces.
    expect(
      normalizeSubmitError([{ message: "broken" }], FALLBACK).snackText,
    ).toBe("broken");
    expect(normalizeSubmitError([{ error: "boom" }], FALLBACK).snackText).toBe(
      "boom",
    );
  });
});
