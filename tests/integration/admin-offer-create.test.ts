import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  createMerchant,
  listMerchants,
} from "@/lib/catalog/merchants";
import {
  createManualOffer,
  listOffers,
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

describe.skipIf(!hasDb)("admin catalog helpers + create path (DB)", () => {
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

  it("createMerchant + createManualOffer then appear in admin list helpers", async () => {
    const slug = uniqueSlug("admin-m");
    const merchant = await createMerchant({
      market: "US",
      slug,
      name: "Admin List Store",
      siteUrl: "https://admin-list.example",
    });
    createdMerchantIds.push(merchant.id);

    const offer = await createManualOffer({
      merchantId: merchant.id,
      title: "Admin listed coupon",
      offerType: "coupon",
      code: "ADMIN10",
      affiliateUrl: "https://affiliate.example/admin-list",
      status: "active",
    });
    createdOfferIds.push(offer.id);

    const merchants = await listMerchants();
    expect(merchants.some((m) => m.id === merchant.id)).toBe(true);

    const offers = await listOffers();
    const found = offers.find((o) => o.id === offer.id);
    expect(found).toBeTruthy();
    expect(found?.title).toBe("Admin listed coupon");
    expect(found?.merchant.id).toBe(merchant.id);
    expect(found?.merchant.slug).toBe(slug);
    expect(found?.status).toBe("active");
  });

  it("listMerchants returns newest merchants first", async () => {
    const a = await createMerchant({
      market: "US",
      slug: uniqueSlug("order-a"),
      name: "Order A",
      siteUrl: "https://a.example",
    });
    createdMerchantIds.push(a.id);

    const b = await createMerchant({
      market: "US",
      slug: uniqueSlug("order-b"),
      name: "Order B",
      siteUrl: "https://b.example",
    });
    createdMerchantIds.push(b.id);

    const merchants = await listMerchants();
    const idxA = merchants.findIndex((m) => m.id === a.id);
    const idxB = merchants.findIndex((m) => m.id === b.id);
    expect(idxA).toBeGreaterThanOrEqual(0);
    expect(idxB).toBeGreaterThanOrEqual(0);
    expect(idxB).toBeLessThan(idxA);
  });
});

describe.runIf(!hasDb)("admin catalog helpers (DB unavailable)", () => {
  it("skips when DATABASE_URL is unreachable", () => {
    console.warn(
      `Skipping admin-offer-create integration tests: DB not available at ${DATABASE_URL}`,
    );
    expect(hasDb).toBe(false);
  });
});
