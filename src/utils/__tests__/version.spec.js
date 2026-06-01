import { satisfies } from "@/utils/version";

describe("satisfies", () => {
  // The two ranges actually used in this repo.
  describe("ranges used in App.vue", () => {
    it("'<5.2' is true for 5.1.x", () => {
      expect(satisfies("5.1.4", "<5.2")).toBe(true);
      expect(satisfies("5.1.0", "<5.2")).toBe(true);
      expect(satisfies("4.99.99", "<5.2")).toBe(true);
    });
    it("'<5.2' is false for 5.2.x and above", () => {
      expect(satisfies("5.2.0", "<5.2")).toBe(false);
      expect(satisfies("5.2", "<5.2")).toBe(false);
      expect(satisfies("5.3.0", "<5.2")).toBe(false);
      expect(satisfies("6.0.0", "<5.2")).toBe(false);
    });
    it("'>=4.0' is true for 4.0.0 and above", () => {
      expect(satisfies("4.0.0", ">=4.0")).toBe(true);
      expect(satisfies("4.0", ">=4.0")).toBe(true);
      expect(satisfies("5.2.0", ">=4.0")).toBe(true);
    });
    it("'>=4.0' is false below 4.0", () => {
      expect(satisfies("3.99.99", ">=4.0")).toBe(false);
      expect(satisfies("3.0.0", ">=4.0")).toBe(false);
    });
  });

  describe("operators", () => {
    it("> is strict", () => {
      expect(satisfies("5.2.1", ">5.2")).toBe(true);
      expect(satisfies("5.2.0", ">5.2")).toBe(false);
      expect(satisfies("5.2", ">5.2")).toBe(false);
    });
    it("<= is inclusive", () => {
      expect(satisfies("5.2.0", "<=5.2")).toBe(true);
      expect(satisfies("5.2", "<=5.2")).toBe(true);
      expect(satisfies("5.2.1", "<=5.2")).toBe(false);
    });
    it("= and bare version both mean equality", () => {
      expect(satisfies("5.2.0", "=5.2")).toBe(true);
      expect(satisfies("5.2.0", "5.2")).toBe(true);
      expect(satisfies("5.2.1", "=5.2")).toBe(false);
    });
  });

  describe("missing parts default to 0", () => {
    it("'5' equals '5.0' equals '5.0.0'", () => {
      expect(satisfies("5", "=5.0.0")).toBe(true);
      expect(satisfies("5.0", "=5.0.0")).toBe(true);
      expect(satisfies("5.0.0", "=5")).toBe(true);
    });
  });

  describe("v-prefix is tolerated (matches semver)", () => {
    it("strips a leading v or V before parsing", () => {
      expect(satisfies("v4.0.0", ">=4.0")).toBe(true);
      expect(satisfies("v5.1.0", "<5.2")).toBe(true);
      expect(satisfies("v5.2.0", "<5.2")).toBe(false);
      expect(satisfies("V5.2.0", ">=4.0")).toBe(true);
    });
  });

  describe("invalid versions", () => {
    it("returns false for non-numeric versions", () => {
      expect(satisfies("unknown", "<5.2")).toBe(false);
      expect(satisfies("5.2.0-dev", "<5.2")).toBe(false);
      expect(satisfies("", "<5.2")).toBe(false);
    });
    it("returns false when version isn't a string", () => {
      expect(satisfies(null, "<5.2")).toBe(false);
      expect(satisfies(undefined, "<5.2")).toBe(false);
      expect(satisfies(5.2, "<5.2")).toBe(false);
    });
  });

  describe("unrecognized ranges", () => {
    it("throws on garbage input so typos don't silently no-op", () => {
      expect(() => satisfies("5.2.0", "around 5")).toThrow(
        /Unsupported version range/,
      );
      expect(() => satisfies("5.2.0", "")).toThrow(/Unsupported version range/);
    });
  });
});
