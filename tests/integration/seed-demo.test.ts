import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { DEMO_MERCHANTS, DEMO_OFFERS, seedDemoCatalog } from "@/lib/catalog/seed-demo";
import { listFeaturedOffers, listRecentOffers } from "@/lib/catalog/offers";
import { getMerchantBySlug } from "@/lib/catalog/merchants";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://coupon:coupon@localhost:5434/coupon";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

async function dbAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

const hasDb = await dbAvailable();

describe.skipIf(!hasDb)("seedDemoCatalog (DB)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("upserts demo merchants and public-visible active offers", async () => {
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

    const first = await seedDemoCatalog(prisma);
    const second = await seedDemoCatalog(prisma);

    expect(first.merchants).toBe(DEMO_MERCHANTS.length);
    expect(first.offers).toBe(DEMO_OFFERS.length);
    expect(second.merchants).toBe(first.merchants);
    expect(second.offers).toBe(first.offers);

    const nike = await getMerchantBySlug({ market: "US", slug: "nike" });
    expect(nike?.name).toBe("Nike");
    expect(nike?.isActive).toBe(true);

    const nikeRows = await prisma.merchant.findMany({
      where: { market: "US", slug: "nike" },
    });
    expect(nikeRows).toHaveLength(1);

    const featured = await listFeaturedOffers({ market: "US", limit: 6 });
    expect(featured.length).toBeGreaterThanOrEqual(6);

    const recent = await listRecentOffers({ market: "US", limit: 8 });
    expect(recent.length).toBeGreaterThanOrEqual(8);
    expect(recent.every((o) => o.status === "active")).toBe(true);
  });
});
