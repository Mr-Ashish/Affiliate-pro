import { describe, it, expect } from "vitest";
import { validateOfferInput } from "@/lib/ingest/validate";

describe("validateOfferInput", () => {
  const base = {
    market: "US",
    title: "20% off",
    offerType: "coupon" as const,
    code: "SAVE20",
    affiliateUrl: "https://example.com/out",
  };

  it("accepts a valid coupon", () => {
    expect(validateOfferInput(base)).toBeNull();
  });

  it("rejects missing title", () => {
    expect(validateOfferInput({ ...base, title: "  " })).toBe("title is required");
  });

  it("rejects bad affiliate URL", () => {
    expect(validateOfferInput({ ...base, affiliateUrl: "not-a-url" })).toMatch(
      /absolute URL/,
    );
  });

  it("rejects empty coupon code string", () => {
    expect(validateOfferInput({ ...base, code: "" })).toMatch(/empty string/);
  });

  it("allows null code for deals", () => {
    expect(
      validateOfferInput({
        ...base,
        offerType: "deal",
        code: null,
      }),
    ).toBeNull();
  });
});
