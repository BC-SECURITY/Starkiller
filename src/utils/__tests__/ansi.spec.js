import { colorizeText } from "@/utils/ansi";

describe("colorizeText", () => {
  it("wraps text in the bold + color ANSI codes for a known color", () => {
    expect(colorizeText("hello", "green")).toBe(
      "\u001b[1m\u001b[92mhello\u001b[0m",
    );
  });

  it("is case-insensitive on the color name", () => {
    expect(colorizeText("hello", "GREEN")).toBe(colorizeText("hello", "green"));
  });

  it("returns the text unchanged for an unrecognized color", () => {
    expect(colorizeText("hello", "purple")).toBe("hello");
  });

  it("returns the text unchanged when no color is given", () => {
    expect(colorizeText("hello")).toBe("hello");
  });
});
