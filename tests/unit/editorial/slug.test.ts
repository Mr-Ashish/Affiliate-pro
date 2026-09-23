import { describe, expect, it } from "vitest";
import { normalizePostSlug, assertPostSlug } from "@/lib/editorial/slug";

describe("normalizePostSlug", () => {
  it("lowercases, trims, and hyphenates", () => {
    expect(normalizePostSlug("  Nike Sale Calendar 2026 ")).toBe(
      "nike-sale-calendar-2026",
    );
  });
  it("strips invalid characters", () => {
    expect(normalizePostSlug("What's the best time to buy a TV?")).toBe(
      "whats-the-best-time-to-buy-a-tv",
    );
  });
});

describe("assertPostSlug", () => {
  it("accepts kebab-case", () => {
    expect(() => assertPostSlug("ulta-sale-calendar")).not.toThrow();
  });
  it("rejects empty, uppercase, underscores, slashes", () => {
    expect(() => assertPostSlug("")).toThrow(/slug/i);
    expect(() => assertPostSlug("Nike")).toThrow(/slug/i);
    expect(() => assertPostSlug("a_b")).toThrow(/slug/i);
    expect(() => assertPostSlug("a/b")).toThrow(/slug/i);
  });
});
