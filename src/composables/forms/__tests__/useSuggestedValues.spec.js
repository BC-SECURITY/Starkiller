import {
  isStrictField,
  shouldSeedBypasses,
} from "@/composables/forms/useSuggestedValues";

describe("isStrictField", () => {
  it.each([["Listener"], ["Bypasses"], ["Profile"], ["CredID"]])(
    "always returns true for STRICT_FIELDS entry %s, even if descriptor.strict is false",
    (name) => {
      expect(isStrictField({ name, strict: false })).toBe(true);
    },
  );

  it("falls back to the descriptor's own strict for non-special fields", () => {
    expect(isStrictField({ name: "Host", strict: false })).toBe(false);
    expect(isStrictField({ name: "Host", strict: true })).toBe(true);
  });

  it("returns a falsy value when a non-special descriptor has no strict set", () => {
    // The exact return for undefined isn't load-bearing; resolveWidget treats
    // any falsy value as `!strict`. Pin the contract, not the implementation.
    expect(isStrictField({ name: "Host", strict: undefined })).toBeFalsy();
  });
});

describe("shouldSeedBypasses", () => {
  const DEFAULTS = ["bypass-a", "bypass-b"];

  it("returns false when the form has no Bypasses property", () => {
    expect(shouldSeedBypasses({ Host: "x" }, DEFAULTS)).toBe(false);
  });

  it("returns false when defaults are empty / missing / non-array", () => {
    expect(shouldSeedBypasses({ Bypasses: [] }, [])).toBe(false);
    expect(shouldSeedBypasses({ Bypasses: [] }, null)).toBe(false);
    expect(shouldSeedBypasses({ Bypasses: [] }, undefined)).toBe(false);
    expect(shouldSeedBypasses({ Bypasses: [] }, "not-an-array")).toBe(false);
  });

  it("returns true when Bypasses is an empty array", () => {
    expect(shouldSeedBypasses({ Bypasses: [] }, DEFAULTS)).toBe(true);
  });

  it("returns true when Bypasses is null or undefined", () => {
    expect(shouldSeedBypasses({ Bypasses: null }, DEFAULTS)).toBe(true);
    expect(shouldSeedBypasses({ Bypasses: undefined }, DEFAULTS)).toBe(true);
  });

  it("returns true when Bypasses is an empty / whitespace string", () => {
    expect(shouldSeedBypasses({ Bypasses: "" }, DEFAULTS)).toBe(true);
    expect(shouldSeedBypasses({ Bypasses: "   " }, DEFAULTS)).toBe(true);
  });

  it("returns false when Bypasses already has a user value (would clobber)", () => {
    expect(shouldSeedBypasses({ Bypasses: ["user-pick"] }, DEFAULTS)).toBe(
      false,
    );
    expect(shouldSeedBypasses({ Bypasses: "custom" }, DEFAULTS)).toBe(false);
  });

  it("returns false when form is null/undefined (defensive)", () => {
    expect(shouldSeedBypasses(null, DEFAULTS)).toBe(false);
    expect(shouldSeedBypasses(undefined, DEFAULTS)).toBe(false);
  });
});
