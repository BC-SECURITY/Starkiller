import { describe, it, expect } from "vitest";
import truncate from "@/utils/truncate";

describe("truncate", () => {
  it("returns short strings unchanged", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns an already-empty string unchanged", () => {
    expect(truncate("", 10)).toBe("");
  });

  it("returns a string exactly at the limit unchanged", () => {
    expect(truncate("abcde", 5)).toBe("abcde");
  });

  it("clips a string one character over the limit", () => {
    expect(truncate("abcdef", 5)).toBe("abcde...");
  });

  it("clips strings longer than the limit and appends an ellipsis", () => {
    expect(truncate("abcdefgh", 5)).toBe("abcde...");
  });

  it("clips everything to a bare ellipsis when max is 0", () => {
    expect(truncate("abc", 0)).toBe("...");
  });

  it("coerces null and undefined to an empty string", () => {
    expect(truncate(null, 10)).toBe("");
    expect(truncate(undefined, 10)).toBe("");
  });

  it("coerces numbers and booleans without throwing", () => {
    expect(truncate(42, 10)).toBe("42");
    expect(truncate(true, 10)).toBe("true");
    expect(truncate(1234567890123, 5)).toBe("12345...");
  });

  it("coerces objects without throwing", () => {
    expect(truncate({}, 50)).toBe("[object Object]");
  });

  it("defaults to a max of 60 characters", () => {
    const long = "a".repeat(70);
    expect(truncate(long)).toBe(`${"a".repeat(60)}...`);
  });
});
