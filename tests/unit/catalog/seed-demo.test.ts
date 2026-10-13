import { describe, expect, it } from "vitest";
import {
  DEMO_MERCHANTS,
  DEMO_OFFERS,
  shouldAllowDemoSeed,
  shouldSeedDemo,
} from "@/lib/catalog/seed-demo";

describe("shouldSeedDemo", () => {
  it("is false with no flag and no env (default seed stays market+admin only)", () => {
    expect(shouldSeedDemo(["node", "prisma/seed.ts"], {})).toBe(false);
  });

  it("is true when --demo is passed", () => {
    expect(
      shouldSeedDemo(["node", "prisma/seed.ts", "--demo"], {}),
    ).toBe(true);
  });

  it("is true when SEED_DEMO is a truthy string", () => {
    expect(shouldSeedDemo(["node", "seed.ts"], { SEED_DEMO: "1" })).toBe(
      true,
    );
    expect(shouldSeedDemo(["node", "seed.ts"], { SEED_DEMO: "true" })).toBe(
      true,
    );
    expect(shouldSeedDemo(["node", "seed.ts"], { SEED_DEMO: "yes" })).toBe(
      true,
    );
  });

  it("is false when SEED_DEMO is unset or off", () => {
    expect(shouldSeedDemo(["node", "seed.ts"], { SEED_DEMO: "0" })).toBe(
      false,
    );
    expect(shouldSeedDemo(["node", "seed.ts"], { SEED_DEMO: "false" })).toBe(
      false,
    );
  });
});

describe("shouldAllowDemoSeed", () => {
  it("allows demo catalog on local and staging", () => {
    expect(shouldAllowDemoSeed("local")).toBe(true);
    expect(shouldAllowDemoSeed("staging")).toBe(true);
    expect(shouldAllowDemoSeed("")).toBe(true);
  });

  it("forbids demo catalog on production", () => {
    expect(shouldAllowDemoSeed("prod")).toBe(false);
    expect(shouldAllowDemoSeed("production")).toBe(false);
    expect(shouldAllowDemoSeed("PROD")).toBe(false);
  });
});

describe("demo catalog contract", () => {
  it("includes enough US merchants for a populated home and stores page", () => {
    expect(DEMO_MERCHANTS.length).toBeGreaterThanOrEqual(6);
    const slugs = DEMO_MERCHANTS.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const merchant of DEMO_MERCHANTS) {
      expect(merchant.market).toBe("US");
      expect(merchant.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(merchant.siteUrl).toMatch(/^https:\/\//);
      expect(merchant.name.length).toBeGreaterThan(0);
    }
  });

  it("includes active featured coupons so public listings are not empty", () => {
    expect(DEMO_OFFERS.length).toBeGreaterThanOrEqual(12);
    const merchantSlugs = new Set(DEMO_MERCHANTS.map((m) => m.slug));
    const recordIds = DEMO_OFFERS.map((o) => o.sourceRecordId);
    expect(new Set(recordIds).size).toBe(recordIds.length);

    const active = DEMO_OFFERS.filter((o) => o.status === "active");
    const featured = active.filter((o) => o.isFeatured);
    expect(active.length).toBeGreaterThanOrEqual(10);
    expect(featured.length).toBeGreaterThanOrEqual(6);

    for (const offer of DEMO_OFFERS) {
      expect(merchantSlugs.has(offer.merchantSlug)).toBe(true);
      expect(offer.sourceRecordId.startsWith("demo:")).toBe(true);
      expect(offer.affiliateUrl).toMatch(/^https:\/\//);
      expect(["coupon", "deal", "sale"]).toContain(offer.offerType);
    }
  });
});
