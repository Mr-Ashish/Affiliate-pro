import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { buildIdentityKey } from "@/lib/catalog/identity";
import {
  createMerchant,
  getMerchantBySlug,
} from "@/lib/catalog/merchants";
import {
  createManualOffer,
  listActiveOffersForStore,
} from "@/lib/catalog/offers";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://coupon:coupon@localhost:5434/coupon";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

const createdMerchantIds: string[] = [];
const createdOfferIds: string[] = [];

async function dbAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

const hasDb = await dbAvailable();

describe.skipIf(!hasDb)("catalog domain (DB)", () => {
  beforeAll(async () => {
    const market = await prisma.market.findUnique({ where: { code: "US" } });
    if (!market) {
      await prisma.market.create({
        data: {
          code: "US",
          name: "United States",
          defaultLocale: "en-US",
          isActive: true,
        },
      });
    }
  });

  afterAll(async () => {
    if (createdOfferIds.length > 0) {
      await prisma.offer.deleteMany({ where: { id: { in: createdOfferIds } } });
    }
    if (createdMerchantIds.length > 0) {
      await prisma.merchant.deleteMany({
        where: { id: { in: createdMerchantIds } },
      });
    }
    await prisma.$disconnect();
  });

  function uniqueSlug(prefix: string) {
    return `${prefix}-${randomUUID().slice(0, 8)}`;
  }

  describe("createMerchant", () => {
    it("creates a merchant row", async () => {
      const slug = uniqueSlug("nike");
      const merchant = await createMerchant({
        market: "US",
        slug,
        name: "Nike",
        siteUrl: "https://www.nike.com",
      });
      createdMerchantIds.push(merchant.id);

      expect(merchant.id).toBeTruthy();
      expect(merchant.market).toBe("US");
      expect(merchant.slug).toBe(slug);
      expect(merchant.name).toBe("Nike");
      expect(merchant.siteUrl).toBe("https://www.nike.com");
      expect(merchant.isActive).toBe(true);

      const bySlug = await getMerchantBySlug({ market: "US", slug });
      expect(bySlug?.id).toBe(merchant.id);
    });

    it("rejects duplicate (market, slug)", async () => {
      const slug = uniqueSlug("dup");
      const first = await createMerchant({
        market: "US",
        slug,
        name: "First",
        siteUrl: "https://example.com",
      });
      createdMerchantIds.push(first.id);

      await expect(
        createMerchant({
          market: "US",
          slug,
          name: "Second",
          siteUrl: "https://example.com/2",
        }),
      ).rejects.toThrow();
    });
  });

  describe("createManualOffer", () => {
    it("persists offer with manual source and identity key", async () => {
      const slug = uniqueSlug("store");
      const merchant = await createMerchant({
        market: "US",
        slug,
        name: "Store Co",
        siteUrl: "https://store.example",
      });
      createdMerchantIds.push(merchant.id);

      const offer = await createManualOffer({
        merchantId: merchant.id,
        title: "20% off sitewide",
        offerType: "coupon",
        code: "SAVE20",
        affiliateUrl: "https://affiliate.example/out?c=1",
        status: "active",
      });
      createdOfferIds.push(offer.id);

      expect(offer.sourceId).toBe("manual");
      expect(offer.sourceRecordId).toBe(offer.id);
      expect(offer.merchantId).toBe(merchant.id);
      expect(offer.market).toBe("US");
      expect(offer.title).toBe("20% off sitewide");
      expect(offer.offerType).toBe("coupon");
      expect(offer.code).toBe("SAVE20");
      expect(offer.status).toBe("active");
      expect(offer.identityKey).toBe(
        buildIdentityKey({
          market: "US",
          merchantExternalKey: slug,
          offerType: "coupon",
          code: "SAVE20",
          title: "20% off sitewide",
        }),
      );

      const row = await prisma.offer.findUnique({ where: { id: offer.id } });
      expect(row?.sourceId).toBe("manual");
      expect(row?.sourceRecordId).toBe(offer.id);
    });

    it("rejects invalid offer input via validateOfferInput", async () => {
      const slug = uniqueSlug("bad");
      const merchant = await createMerchant({
        market: "US",
        slug,
        name: "Bad Store",
        siteUrl: "https://bad.example",
      });
      createdMerchantIds.push(merchant.id);

      await expect(
        createManualOffer({
          merchantId: merchant.id,
          title: "  ",
          offerType: "coupon",
          code: "X",
          affiliateUrl: "https://example.com",
          status: "active",
        }),
      ).rejects.toThrow(/title is required/);
    });
  });

  describe("listActiveOffersForStore", () => {
    it("returns only active offers in date window for active merchant", async () => {
      const slug = uniqueSlug("list");
      const merchant = await createMerchant({
        market: "US",
        slug,
        name: "List Store",
        siteUrl: "https://list.example",
      });
      createdMerchantIds.push(merchant.id);

      const now = new Date("2026-06-15T12:00:00.000Z");

      const active = await createManualOffer({
        merchantId: merchant.id,
        title: "Active offer",
        offerType: "deal",
        code: null,
        affiliateUrl: "https://aff.example/a",
        status: "active",
        startsAt: new Date("2026-06-01T00:00:00.000Z"),
        endsAt: new Date("2026-07-01T00:00:00.000Z"),
      });
      createdOfferIds.push(active.id);

      const draft = await createManualOffer({
        merchantId: merchant.id,
        title: "Draft offer",
        offerType: "deal",
        code: null,
        affiliateUrl: "https://aff.example/d",
        status: "draft",
      });
      createdOfferIds.push(draft.id);

      const disabled = await createManualOffer({
        merchantId: merchant.id,
        title: "Disabled offer",
        offerType: "deal",
        code: null,
        affiliateUrl: "https://aff.example/dis",
        status: "disabled",
      });
      createdOfferIds.push(disabled.id);

      const expired = await createManualOffer({
        merchantId: merchant.id,
        title: "Expired offer",
        offerType: "deal",
        code: null,
        affiliateUrl: "https://aff.example/e",
        status: "expired",
      });
      createdOfferIds.push(expired.id);

      const pastEnds = await createManualOffer({
        merchantId: merchant.id,
        title: "Past endsAt",
        offerType: "coupon",
        code: "OLD",
        affiliateUrl: "https://aff.example/old",
        status: "active",
        endsAt: new Date("2026-06-01T00:00:00.000Z"),
      });
      createdOfferIds.push(pastEnds.id);

      const futureStart = await createManualOffer({
        merchantId: merchant.id,
        title: "Not started",
        offerType: "deal",
        code: null,
        affiliateUrl: "https://aff.example/fs",
        status: "active",
        startsAt: new Date("2026-07-01T00:00:00.000Z"),
      });
      createdOfferIds.push(futureStart.id);

      const openWindow = await createManualOffer({
        merchantId: merchant.id,
        title: "Open dates",
        offerType: "sale",
        code: null,
        affiliateUrl: "https://aff.example/open",
        status: "active",
        startsAt: null,
        endsAt: null,
      });
      createdOfferIds.push(openWindow.id);

      const listed = await listActiveOffersForStore({
        market: "US",
        slug,
        now,
      });
      const titles = listed.map((o) => o.title).sort();
      expect(titles).toEqual(["Active offer", "Open dates"]);
    });

    it("returns empty when merchant is inactive", async () => {
      const slug = uniqueSlug("inactive");
      const merchant = await createMerchant({
        market: "US",
        slug,
        name: "Inactive Store",
        siteUrl: "https://inactive.example",
      });
      createdMerchantIds.push(merchant.id);

      await prisma.merchant.update({
        where: { id: merchant.id },
        data: { isActive: false },
      });

      const offer = await createManualOffer({
        merchantId: merchant.id,
        title: "Hidden",
        offerType: "deal",
        code: null,
        affiliateUrl: "https://aff.example/h",
        status: "active",
      });
      createdOfferIds.push(offer.id);

      const listed = await listActiveOffersForStore({
        market: "US",
        slug,
        now: new Date(),
      });
      expect(listed).toEqual([]);
    });
  });
});

describe.runIf(!hasDb)("catalog domain (DB unavailable)", () => {
  it("skips when DATABASE_URL is unreachable", () => {
    console.warn(
      `Skipping catalog integration tests: DB not available at ${DATABASE_URL}`,
    );
    expect(hasDb).toBe(false);
  });
});
