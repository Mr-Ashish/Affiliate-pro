import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createMerchant } from "@/lib/catalog/merchants";
import {
  createManualOffer,
  listActiveOffersForStore,
  updateOfferStatus,
} from "@/lib/catalog/offers";
import { resolveOutboundRedirect } from "@/lib/catalog/go";

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

describe.skipIf(!hasDb)("updateOfferStatus (DB)", () => {
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

  async function seedActiveOffer() {
    const slug = `status-${randomUUID().slice(0, 8)}`;
    const merchant = await createMerchant({
      market: "US",
      slug,
      name: "Status Store",
      siteUrl: "https://status.example",
    });
    createdMerchantIds.push(merchant.id);
    const offer = await createManualOffer({
      merchantId: merchant.id,
      title: "Pause me",
      offerType: "coupon",
      code: "PAUSE10",
      affiliateUrl: "https://aff.example/pause",
      status: "active",
    });
    createdOfferIds.push(offer.id);
    return { merchant, offer, slug };
  }

  it("disables an active offer so it leaves public listings and /go", async () => {
    const { offer, slug } = await seedActiveOffer();

    const updated = await updateOfferStatus(offer.id, "disabled");
    expect(updated.status).toBe("disabled");

    const publicOffers = await listActiveOffersForStore({
      market: "US",
      slug,
    });
    expect(publicOffers.map((o) => o.id)).not.toContain(offer.id);
    await expect(resolveOutboundRedirect(offer.id)).resolves.toBeNull();
  });

  it("re-enables a disabled offer", async () => {
    const { offer, slug } = await seedActiveOffer();
    await updateOfferStatus(offer.id, "disabled");

    const updated = await updateOfferStatus(offer.id, "active");
    expect(updated.status).toBe("active");

    const publicOffers = await listActiveOffersForStore({
      market: "US",
      slug,
    });
    expect(publicOffers.map((o) => o.id)).toContain(offer.id);
    await expect(resolveOutboundRedirect(offer.id)).resolves.toEqual({
      url: "https://aff.example/pause",
    });
  });

  it("expires an offer (retire) without deleting the row", async () => {
    const { offer } = await seedActiveOffer();
    const updated = await updateOfferStatus(offer.id, "expired");
    expect(updated.status).toBe("expired");
    const row = await prisma.offer.findUnique({ where: { id: offer.id } });
    expect(row).not.toBeNull();
    expect(row?.code).toBe("PAUSE10");
    await expect(resolveOutboundRedirect(offer.id)).resolves.toBeNull();
  });

  it("rejects unknown status and missing offers", async () => {
    const { offer } = await seedActiveOffer();
    await expect(updateOfferStatus(offer.id, "deleted")).rejects.toThrow(
      /status/i,
    );
    await expect(
      updateOfferStatus(randomUUID(), "disabled"),
    ).rejects.toThrow(/not found/i);
  });
});
