import { describe, it, expect } from "vitest";
import { buildIdentityKey } from "@/lib/catalog/identity";

describe("buildIdentityKey", () => {
  it("is stable for same market merchant type and code (case-insensitive code)", () => {
    const a = buildIdentityKey({
      market: "US",
      merchantExternalKey: "nike",
      offerType: "coupon",
      code: "SAVE20",
      title: "20% off",
    });
    const b = buildIdentityKey({
      market: "US",
      merchantExternalKey: "nike",
      offerType: "coupon",
      code: "save20",
      title: "Different title",
    });
    expect(a).toBe(b);
    expect(a).toHaveLength(32);
  });

  it("differs when merchant changes", () => {
    const a = buildIdentityKey({
      market: "US",
      merchantExternalKey: "nike",
      offerType: "deal",
      code: null,
      title: "Sitewide sale",
    });
    const b = buildIdentityKey({
      market: "US",
      merchantExternalKey: "adidas",
      offerType: "deal",
      code: null,
      title: "Sitewide sale",
    });
    expect(a).not.toBe(b);
  });

  it("uses title when code is absent", () => {
    const a = buildIdentityKey({
      market: "US",
      merchantExternalKey: "nike",
      offerType: "deal",
      code: null,
      title: "Spring Sale",
    });
    const b = buildIdentityKey({
      market: "US",
      merchantExternalKey: "nike",
      offerType: "deal",
      code: null,
      title: "Winter Sale",
    });
    expect(a).not.toBe(b);
  });
});
