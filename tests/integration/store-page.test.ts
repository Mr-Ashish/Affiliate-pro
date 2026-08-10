import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createMerchant } from "@/lib/catalog/merchants";
import { createManualOffer } from "@/lib/catalog/offers";
import { getStorePageData } from "@/lib/catalog/store-page";

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

describe.skipIf(!hasDb)("getStorePageData (DB)", () => {
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

  it("returns merchant + active offers for active store", async () => {
    const slug = uniqueSlug("pub");
    const merchant = await createMerchant({
      market: "US",
      slug,
      name: "Public Store",
      siteUrl: "https://public.example",
      description: "A test store",
    });
    createdMerchantIds.push(merchant.id);

    const offer = await createManualOffer({
      merchantId: merchant.id,
      title: "10% off",
      offerType: "coupon",
      code: "TEN",
      affiliateUrl: "https://affiliate.example/out?c=10",
      status: "active",
    });
    createdOfferIds.push(offer.id);

    const data = await getStorePageData({ market: "US", slug });
    expect(data).not.toBeNull();
    expect(data!.merchant.id).toBe(merchant.id);
    expect(data!.merchant.name).toBe("Public Store");
    expect(data!.offers.map((o) => o.id)).toContain(offer.id);
  });

  it("returns null for missing slug", async () => {
    const data = await getStorePageData({
      market: "US",
      slug: `missing-${randomUUID().slice(0, 8)}`,
    });
    expect(data).toBeNull();
  });

  it("returns null for inactive merchant", async () => {
    const slug = uniqueSlug("inact");
    const merchant = await createMerchant({
      market: "US",
      slug,
      name: "Inactive Co",
      siteUrl: "https://inactive.example",
      isActive: false,
    });
    createdMerchantIds.push(merchant.id);

    const data = await getStorePageData({ market: "US", slug });
    expect(data).toBeNull();
  });
});
