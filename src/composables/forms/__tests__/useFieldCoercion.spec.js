import {
  buildInitialForm,
  serializeForm,
} from "@/composables/forms/useFieldCoercion";

describe("buildInitialForm", () => {
  it("uses empty string for nullish values and preserves real values", () => {
    const form = buildInitialForm([
      { name: "Name", value: "abc" },
      { name: "Empty", value: null },
      { name: "Zero", value: 0 },
      { name: "False", value: false },
    ]);
    expect(form).toEqual({ Name: "abc", Empty: "", Zero: 0, False: false });
  });

  it("splits a Bypasses string into a trimmed, non-empty array", () => {
    expect(
      buildInitialForm([{ name: "Bypasses", value: "a  b   c" }]).Bypasses,
    ).toEqual(["a", "b", "c"]);
  });

  it("passes a Bypasses array through unchanged", () => {
    expect(
      buildInitialForm([{ name: "Bypasses", value: ["a", "b"] }]).Bypasses,
    ).toEqual(["a", "b"]);
  });

  it("treats a null Bypasses as an empty array", () => {
    expect(
      buildInitialForm([{ name: "Bypasses", value: null }]).Bypasses,
    ).toEqual([]);
  });
});

describe("serializeForm", () => {
  it("joins a Bypasses array into a space-separated string", () => {
    expect(serializeForm({ Name: "x", Bypasses: ["a", "b"] })).toEqual({
      Name: "x",
      Bypasses: "a b",
    });
  });

  it("does not mutate the input form", () => {
    const input = { Bypasses: ["a", "b"] };
    serializeForm(input);
    expect(input.Bypasses).toEqual(["a", "b"]);
  });

  it("leaves a form without Bypasses untouched", () => {
    expect(serializeForm({ Name: "x" })).toEqual({ Name: "x" });
  });
});
