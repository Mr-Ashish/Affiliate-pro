import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { createMerchant } from "@/lib/catalog/merchants";
import { createManualOffer } from "@/lib/catalog/offers";
import { resolveOutboundRedirect } from "@/lib/catalog/go";
import { GET } from "@/app/go/[id]/route";

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

async function callGo(
  offerId: string,
  opts?: { search?: string; referer?: string },
) {
  const url = `http://localhost/go/${offerId}${opts?.search ?? ""}`;
  const headers = new Headers();
  if (opts?.referer) headers.set("referer", opts.referer);
  const request = new NextRequest(url, { method: "GET", headers });
  return GET(request, { params: Promise.resolve({ id: offerId }) });
}

describe.skipIf(!hasDb)("/go redirect + clicks (DB)", () => {
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
      await prisma.clickEvent.deleteMany({
        where: { offerId: { in: createdOfferIds } },
      });
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

  async function seedActiveOffer(opts?: {
    status?: "draft" | "active" | "expired" | "disabled";
    startsAt?: Date | null;
    endsAt?: Date | null;
    merchantActive?: boolean;
    affiliateUrl?: string;
  }) {
    const merchant = await createMerchant({
      market: "US",
      slug: uniqueSlug("go-m"),
      name: "Go Merchant",
      siteUrl: "https://merchant.example",
      isActive: opts?.merchantActive ?? true,
    });
    createdMerchantIds.push(merchant.id);

    const offer = await createManualOffer({
      merchantId: merchant.id,
      title: "Go deal",
      offerType: "deal",
      affiliateUrl: opts?.affiliateUrl ?? "https://affiliate.example/track?o=1",
      status: opts?.status ?? "active",
      startsAt: opts?.startsAt ?? null,
      endsAt: opts?.endsAt ?? null,
    });
    createdOfferIds.push(offer.id);
    return { merchant, offer };
  }

  it("resolveOutboundRedirect returns affiliate url for active offer", async () => {
    const { offer } = await seedActiveOffer();
    const result = await resolveOutboundRedirect(offer.id);
    expect(result).toEqual({ url: offer.affiliateUrl });
  });

  it("GET /go/:id redirects 302 to affiliateUrl and logs click", async () => {
    const { offer } = await seedActiveOffer({
      affiliateUrl: "https://affiliate.example/out?x=active",
    });

    const before = await prisma.offer.findUniqueOrThrow({
      where: { id: offer.id },
    });
    expect(before.clickCount).toBe(0);

    const response = await callGo(offer.id);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://affiliate.example/out?x=active",
    );
    expect(response.headers.get("cache-control")).toMatch(/no-store/i);

    const after = await prisma.offer.findUniqueOrThrow({
      where: { id: offer.id },
    });
    expect(after.clickCount).toBe(1);

    const clicks = await prisma.clickEvent.findMany({
      where: { offerId: offer.id },
    });
    expect(clicks).toHaveLength(1);
    expect(clicks[0]!.offerId).toBe(offer.id);
  });

  it("stores ?src= in click meta", async () => {
    const { offer } = await seedActiveOffer();
    const response = await callGo(offer.id, { search: "?src=store" });
    expect(response.status).toBe(302);

    const click = await prisma.clickEvent.findFirstOrThrow({
      where: { offerId: offer.id },
    });
    expect(click.meta).toEqual({ src: "store" });
  });

  it("returns 404 for disabled offer", async () => {
    const { offer } = await seedActiveOffer({ status: "disabled" });
    const response = await callGo(offer.id);
    expect(response.status).toBe(404);

    const clicks = await prisma.clickEvent.count({
      where: { offerId: offer.id },
    });
    expect(clicks).toBe(0);
  });

  it("returns 404 for draft offer", async () => {
    const { offer } = await seedActiveOffer({ status: "draft" });
    const response = await callGo(offer.id);
    expect(response.status).toBe(404);
  });

  it("returns 404 for expired status offer", async () => {
    const { offer } = await seedActiveOffer({ status: "expired" });
    const response = await callGo(offer.id);
    expect(response.status).toBe(404);
  });

  it("returns 404 when endsAt is in the past", async () => {
    const { offer } = await seedActiveOffer({
      status: "active",
      endsAt: new Date(Date.now() - 60_000),
    });
    const response = await callGo(offer.id);
    expect(response.status).toBe(404);
  });

  it("returns 404 when startsAt is in the future", async () => {
    const { offer } = await seedActiveOffer({
      status: "active",
      startsAt: new Date(Date.now() + 60 * 60_000),
    });
    const response = await callGo(offer.id);
    expect(response.status).toBe(404);
  });

  it("returns 404 for inactive merchant", async () => {
    const { offer } = await seedActiveOffer({ merchantActive: false });
    const response = await callGo(offer.id);
    expect(response.status).toBe(404);
  });

  it("returns 404 for unknown offer id", async () => {
    const response = await callGo(randomUUID());
    expect(response.status).toBe(404);
  });

  it("never open-redirects: only DB affiliateUrl", async () => {
    const { offer } = await seedActiveOffer({
      affiliateUrl: "https://trusted-network.example/a/123",
    });
    const response = await callGo(offer.id, {
      search: "?url=https://evil.example",
    });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://trusted-network.example/a/123",
    );
    expect(response.headers.get("location")).not.toContain("evil");
  });
});
