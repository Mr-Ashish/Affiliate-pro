import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createMerchant } from "@/lib/catalog/merchants";
import {
  createManualOffer,
  getAdminDashboardStats,
  listFeaturedOffers,
  listRecentOffers,
  listTopOffersByClicks,
} from "@/lib/catalog/offers";
import { listPopularMerchants } from "@/lib/catalog/merchants";

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

describe.skipIf(!hasDb)("catalog home/admin helpers (DB)", () => {
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

  it("listFeaturedOffers returns only featured active", async () => {
    const slug = uniqueSlug("feat");
    const merchant = await createMerchant({
      market: "US",
      slug,
      name: "Featured Store",
      siteUrl: "https://example.com",
    });
    createdMerchantIds.push(merchant.id);

    const featured = await createManualOffer({
      merchantId: merchant.id,
      title: "Featured deal",
      offerType: "deal",
      affiliateUrl: "https://example.com/a",
      status: "active",
      isFeatured: true,
    });
    createdOfferIds.push(featured.id);

    const plain = await createManualOffer({
      merchantId: merchant.id,
      title: "Plain deal",
      offerType: "deal",
      affiliateUrl: "https://example.com/b",
      status: "active",
      isFeatured: false,
    });
    createdOfferIds.push(plain.id);

    const rows = await listFeaturedOffers({ market: "US", limit: 50 });
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(featured.id);
    expect(ids).not.toContain(plain.id);
  });

  it("listRecentOffers returns newest active first", async () => {
    const slug = uniqueSlug("recent");
    const merchant = await createMerchant({
      market: "US",
      slug,
      name: "Recent Store",
      siteUrl: "https://example.com",
    });
    createdMerchantIds.push(merchant.id);

    const offer = await createManualOffer({
      merchantId: merchant.id,
      title: "Recent offer " + slug,
      offerType: "coupon",
      code: "R1",
      affiliateUrl: "https://example.com/c",
      status: "active",
    });
    createdOfferIds.push(offer.id);

    const rows = await listRecentOffers({ market: "US", limit: 50 });
    expect(rows.some((r) => r.id === offer.id)).toBe(true);
    expect(rows[0]?.merchant).toBeTruthy();
  });

  it("listPopularMerchants ranks by offer count", async () => {
    const slugA = uniqueSlug("pop-a");
    const slugB = uniqueSlug("pop-b");
    const a = await createMerchant({
      market: "US",
      slug: slugA,
      name: "Pop A " + slugA,
      siteUrl: "https://example.com",
    });
    const b = await createMerchant({
      market: "US",
      slug: slugB,
      name: "Pop B " + slugB,
      siteUrl: "https://example.com",
    });
    createdMerchantIds.push(a.id, b.id);

    const o1 = await createManualOffer({
      merchantId: a.id,
      title: "A1",
      offerType: "deal",
      affiliateUrl: "https://example.com/1",
      status: "active",
    });
    const o2 = await createManualOffer({
      merchantId: a.id,
      title: "A2",
      offerType: "deal",
      affiliateUrl: "https://example.com/2",
      status: "active",
    });
    const o3 = await createManualOffer({
      merchantId: b.id,
      title: "B1",
      offerType: "deal",
      affiliateUrl: "https://example.com/3",
      status: "active",
    });
    createdOfferIds.push(o1.id, o2.id, o3.id);

    const rows = await listPopularMerchants({ market: "US", limit: 100 });
    const aRow = rows.find((r) => r.id === a.id);
    const bRow = rows.find((r) => r.id === b.id);
    expect(aRow?.offerCount).toBeGreaterThanOrEqual(2);
    expect(bRow?.offerCount).toBeGreaterThanOrEqual(1);
    const ai = rows.findIndex((r) => r.id === a.id);
    const bi = rows.findIndex((r) => r.id === b.id);
    expect(ai).toBeLessThan(bi);
  });

  it("getAdminDashboardStats and listTopOffersByClicks", async () => {
    const stats = await getAdminDashboardStats();
    expect(stats.activeOffers).toBeGreaterThanOrEqual(0);
    expect(stats.merchantCount).toBeGreaterThanOrEqual(0);
    expect(typeof stats.expiredOffers).toBe("number");
    expect(typeof stats.draftOffers).toBe("number");

    const top = await listTopOffersByClicks(5);
    expect(Array.isArray(top)).toBe(true);
    expect(top.length).toBeLessThanOrEqual(5);
  });
});
