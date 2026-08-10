import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  createMerchant,
  listActiveMerchants,
  listPopularMerchants,
} from "@/lib/catalog/merchants";
import {
  createManualOffer,
  listActiveOffersForMerchantId,
} from "@/lib/catalog/offers";
import { getHealthStatus } from "@/lib/health";

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

describe.skipIf(!hasDb)("catalog query performance helpers (DB)", () => {
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

  it("listActiveMerchants filters by name/slug in the database", async () => {
    const needle = `qfind-${randomUUID().slice(0, 8)}`;
    const hit = await createMerchant({
      market: "US",
      slug: needle,
      name: `Hit ${needle}`,
      siteUrl: "https://hit.example",
    });
    const miss = await createMerchant({
      market: "US",
      slug: uniqueSlug("qmiss"),
      name: "Unrelated Store",
      siteUrl: "https://miss.example",
    });
    createdMerchantIds.push(hit.id, miss.id);

    const rows = await listActiveMerchants({ market: "US", q: needle });
    expect(rows.map((m) => m.id)).toContain(hit.id);
    expect(rows.map((m) => m.id)).not.toContain(miss.id);
  });

  it("listActiveOffersForMerchantId skips a second merchant slug lookup", async () => {
    const merchant = await createMerchant({
      market: "US",
      slug: uniqueSlug("byid"),
      name: "By Id Store",
      siteUrl: "https://byid.example",
    });
    createdMerchantIds.push(merchant.id);

    const active = await createManualOffer({
      merchantId: merchant.id,
      title: "Live by id",
      offerType: "deal",
      affiliateUrl: "https://aff.example/byid",
      status: "active",
    });
    const draft = await createManualOffer({
      merchantId: merchant.id,
      title: "Draft by id",
      offerType: "deal",
      affiliateUrl: "https://aff.example/draft",
      status: "draft",
    });
    createdOfferIds.push(active.id, draft.id);

    const rows = await listActiveOffersForMerchantId({
      merchantId: merchant.id,
      market: "US",
    });
    expect(rows.map((o) => o.id)).toContain(active.id);
    expect(rows.map((o) => o.id)).not.toContain(draft.id);
  });

  it("listPopularMerchants still ranks by active offer count after SQL rewrite", async () => {
    const slugA = uniqueSlug("sql-a");
    const slugB = uniqueSlug("sql-b");
    const a = await createMerchant({
      market: "US",
      slug: slugA,
      name: "Sql A " + slugA,
      siteUrl: "https://example.com",
    });
    const b = await createMerchant({
      market: "US",
      slug: slugB,
      name: "Sql B " + slugB,
      siteUrl: "https://example.com",
    });
    createdMerchantIds.push(a.id, b.id);

    const offers = await Promise.all([
      createManualOffer({
        merchantId: a.id,
        title: "A1",
        offerType: "deal",
        affiliateUrl: "https://example.com/a1",
        status: "active",
      }),
      createManualOffer({
        merchantId: a.id,
        title: "A2",
        offerType: "deal",
        affiliateUrl: "https://example.com/a2",
        status: "active",
      }),
      createManualOffer({
        merchantId: b.id,
        title: "B1",
        offerType: "deal",
        affiliateUrl: "https://example.com/b1",
        status: "active",
      }),
    ]);
    createdOfferIds.push(...offers.map((o) => o.id));

    const rows = await listPopularMerchants({ market: "US", limit: 200 });
    const ai = rows.findIndex((r) => r.id === a.id);
    const bi = rows.findIndex((r) => r.id === b.id);
    expect(ai).toBeGreaterThanOrEqual(0);
    expect(bi).toBeGreaterThanOrEqual(0);
    expect(ai).toBeLessThan(bi);
    expect(rows[ai]?.offerCount).toBeGreaterThanOrEqual(2);
  });

  it("getHealthStatus reports db up when Postgres accepts connections", async () => {
    const status = await getHealthStatus();
    expect(status.ok).toBe(true);
    expect(status.db).toBe("up");
  });
});
