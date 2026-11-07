import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createMerchant } from "@/lib/catalog/merchants";
import { createManualOffer, listExclusiveOffers } from "@/lib/catalog/offers";

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

describe.skipIf(!hasDb)("listExclusiveOffers (DB)", () => {
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

  it("returns only exclusive active offers with active merchants", async () => {
    const slug = uniqueSlug("excl");
    const merchant = await createMerchant({
      market: "US",
      slug,
      name: "Exclusive Store",
      siteUrl: "https://example.com",
    });
    createdMerchantIds.push(merchant.id);

    const exclusive = await createManualOffer({
      merchantId: merchant.id,
      title: "Exclusive deal",
      offerType: "deal",
      affiliateUrl: "https://example.com/a",
      status: "active",
      isExclusive: true,
      isFeatured: false,
    });
    createdOfferIds.push(exclusive.id);

    const plain = await createManualOffer({
      merchantId: merchant.id,
      title: "Plain deal",
      offerType: "deal",
      affiliateUrl: "https://example.com/b",
      status: "active",
      isExclusive: false,
    });
    createdOfferIds.push(plain.id);

    const rows = await listExclusiveOffers({ market: "US", limit: 50 });
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(exclusive.id);
    expect(ids).not.toContain(plain.id);
  });

  it("respects limit", async () => {
    const slug = uniqueSlug("excl-limit");
    const merchant = await createMerchant({
      market: "US",
      slug,
      name: "Exclusive Limit Store",
      siteUrl: "https://example.com",
    });
    createdMerchantIds.push(merchant.id);

    for (let i = 0; i < 3; i++) {
      const offer = await createManualOffer({
        merchantId: merchant.id,
        title: `Exclusive ${i} ${slug}`,
        offerType: "deal",
        affiliateUrl: `https://example.com/l${i}`,
        status: "active",
        isExclusive: true,
      });
      createdOfferIds.push(offer.id);
    }

    const rows = await listExclusiveOffers({ market: "US", limit: 2 });
    expect(rows.length).toBeLessThanOrEqual(2);
  });
});
