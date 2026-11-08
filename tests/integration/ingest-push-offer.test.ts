import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { expireUnseenOffers, pushNormalizedOffer } from "@/lib/ingest/push-offer";
import type { NormalizedOfferInput } from "@/lib/ingest/types";

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

function sampleOffer(
  overrides: Partial<NormalizedOfferInput> = {},
): NormalizedOfferInput {
  const suffix = randomUUID().slice(0, 8);
  return {
    sourceId: "awin",
    sourceRecordId: `promo-${suffix}`,
    market: "US",
    merchantExternalId: `adv-${suffix}`,
    merchantName: "Test Merchant",
    merchantSiteUrl: "https://www.example.com",
    merchantLogoUrl: "https://cdn.example.com/logo.png",
    title: "10% off",
    description: "Save 10 percent",
    terms: null,
    offerType: "deal",
    code: null,
    affiliateUrl: "https://www.awin1.com/cread.php?awinmid=1",
    startsAt: new Date("2026-11-01T00:00:00Z"),
    endsAt: new Date("2026-12-01T00:00:00Z"),
    isExclusive: false,
    status: "active",
    rawPayload: { promotionId: suffix },
    ...overrides,
  };
}

describe.skipIf(!hasDb)("ingest pushNormalizedOffer (DB)", () => {
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
      await prisma.rawSourcePayload.deleteMany({
        where: { offerId: { in: createdOfferIds } },
      });
      await prisma.offer.deleteMany({ where: { id: { in: createdOfferIds } } });
    }
    if (createdMerchantIds.length > 0) {
      await prisma.merchantExternalId.deleteMany({
        where: { merchantId: { in: createdMerchantIds } },
      });
      await prisma.merchant.deleteMany({
        where: { id: { in: createdMerchantIds } },
      });
    }
    await prisma.$disconnect();
  });

  it("creates a stub merchant and upserts the offer by source key", async () => {
    const input = sampleOffer({ title: "First title" });
    const created = await pushNormalizedOffer(input);
    createdMerchantIds.push(created.merchantId);
    createdOfferIds.push(created.id);

    expect(created.sourceId).toBe("awin");
    expect(created.sourceRecordId).toBe(input.sourceRecordId);
    expect(created.title).toBe("First title");
    expect(created.clickCount).toBe(0);

    const mapping = await prisma.merchantExternalId.findUnique({
      where: {
        sourceId_externalId_market: {
          sourceId: "awin",
          externalId: input.merchantExternalId,
          market: "US",
        },
      },
    });
    expect(mapping?.merchantId).toBe(created.merchantId);

    const updated = await pushNormalizedOffer({
      ...input,
      title: "Updated title",
    });
    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe("Updated title");
    expect(updated.clickCount).toBe(0);
  });

  it("does not reactivate an admin-disabled offer", async () => {
    const input = sampleOffer({ title: "Disabled later" });
    const created = await pushNormalizedOffer(input);
    createdMerchantIds.push(created.merchantId);
    createdOfferIds.push(created.id);

    await prisma.offer.update({
      where: { id: created.id },
      data: { status: "disabled", clickCount: 7, isFeatured: true },
    });

    const again = await pushNormalizedOffer({
      ...input,
      title: "Still disabled",
    });
    expect(again.status).toBe("disabled");
    expect(again.clickCount).toBe(7);
    expect(again.isFeatured).toBe(true);
    expect(again.title).toBe("Still disabled");
  });

  it("expires unseen offers for one source only after a successful pull", async () => {
    const keep = sampleOffer({ sourceRecordId: `keep-${randomUUID().slice(0, 8)}` });
    const drop = sampleOffer({
      sourceRecordId: `drop-${randomUUID().slice(0, 8)}`,
      merchantExternalId: keep.merchantExternalId,
      merchantName: keep.merchantName,
    });
    const kept = await pushNormalizedOffer(keep);
    const dropped = await pushNormalizedOffer(drop);
    createdMerchantIds.push(kept.merchantId);
    createdOfferIds.push(kept.id, dropped.id);

    const expired = await expireUnseenOffers({
      sourceId: "awin",
      seenRecordIds: [keep.sourceRecordId],
      merchantIds: [kept.merchantId],
    });
    expect(expired).toBeGreaterThanOrEqual(1);

    const keptRow = await prisma.offer.findUnique({ where: { id: kept.id } });
    const droppedRow = await prisma.offer.findUnique({ where: { id: dropped.id } });
    expect(keptRow?.status).toBe("active");
    expect(droppedRow?.status).toBe("expired");
  });

  it("creates a GB market and a separate merchant from the US stub", async () => {
    const us = sampleOffer({ market: "US", title: "US deal" });
    const gb = sampleOffer({
      market: "GB",
      merchantExternalId: us.merchantExternalId,
      merchantName: us.merchantName,
      merchantSiteUrl: us.merchantSiteUrl,
      title: "GB deal",
    });
    const createdUs = await pushNormalizedOffer(us);
    const createdGb = await pushNormalizedOffer(gb);
    createdMerchantIds.push(createdUs.merchantId, createdGb.merchantId);
    createdOfferIds.push(createdUs.id, createdGb.id);

    expect(createdUs.market).toBe("US");
    expect(createdGb.market).toBe("GB");
    expect(createdGb.merchantId).not.toBe(createdUs.merchantId);

    const gbMarket = await prisma.market.findUnique({ where: { code: "GB" } });
    expect(gbMarket?.isActive).toBe(true);
  });
});
