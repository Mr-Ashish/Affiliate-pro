import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { buildIdentityKey } from "@/lib/catalog/identity";
import { validateOfferInput } from "@/lib/ingest/validate";
import { slugifyMerchantName } from "@/lib/ingest/slug";
import { marketMeta } from "@/lib/market/meta";
import type { NormalizedOfferInput, SourceId } from "@/lib/ingest/types";
import { applyKnownCategorySlugs } from "@/lib/catalog/categories";

async function ensureMarket(code: string) {
  const meta = marketMeta(code);
  await prisma.market.upsert({
    where: { code },
    create: {
      code,
      name: meta.name,
      defaultLocale: meta.defaultLocale,
      isActive: true,
    },
    update: {},
  });
}

async function uniqueSlug(
  base: string,
  externalId: string,
  market: string,
): Promise<string> {
  const primary = slugifyMerchantName(base);
  const existing = await prisma.merchant.findUnique({
    where: { market_slug: { market, slug: primary } },
  });
  if (!existing) return primary;
  const withId = slugifyMerchantName(`${primary}-${externalId}`);
  const clash = await prisma.merchant.findUnique({
    where: { market_slug: { market, slug: withId } },
  });
  if (!clash) return withId;
  return slugifyMerchantName(`${withId}-${randomUUID().slice(0, 6)}`);
}

async function resolveMerchant(input: NormalizedOfferInput) {
  const mapping = await prisma.merchantExternalId.findUnique({
    where: {
      sourceId_externalId_market: {
        sourceId: input.sourceId,
        externalId: input.merchantExternalId,
        market: input.market,
      },
    },
  });
  if (mapping) {
    return prisma.merchant.findUniqueOrThrow({ where: { id: mapping.merchantId } });
  }

  const siteUrl = input.merchantSiteUrl?.trim();
  if (!siteUrl) {
    throw new Error(
      `cannot create merchant stub for ${input.sourceId}:${input.merchantExternalId} without siteUrl`,
    );
  }

  const slug = await uniqueSlug(
    input.merchantName,
    input.merchantExternalId,
    input.market,
  );
  const merchant = await prisma.merchant.create({
    data: {
      market: input.market,
      slug,
      name: input.merchantName.trim(),
      siteUrl,
      logoUrl: input.merchantLogoUrl ?? null,
      isActive: true,
    },
  });
  await prisma.merchantExternalId.create({
    data: {
      merchantId: merchant.id,
      sourceId: input.sourceId,
      externalId: input.merchantExternalId,
      market: input.market,
    },
  });
  return merchant;
}

export async function pushNormalizedOffer(input: NormalizedOfferInput) {
  const market = input.market.trim().toUpperCase();
  await ensureMarket(market);
  const validationError = validateOfferInput({
    market,
    title: input.title,
    description: input.description ?? undefined,
    offerType: input.offerType,
    code: input.code,
    affiliateUrl: input.affiliateUrl,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  });
  if (validationError) {
    throw new Error(validationError);
  }

  const merchant = await resolveMerchant({ ...input, market });
  const identityKey = buildIdentityKey({
    market,
    merchantExternalKey: merchant.slug,
    offerType: input.offerType,
    code: input.code,
    title: input.title,
  });

  const existing = await prisma.offer.findUnique({
    where: {
      sourceId_sourceRecordId: {
        sourceId: input.sourceId,
        sourceRecordId: input.sourceRecordId,
      },
    },
  });

  const status = existing?.status === "disabled" ? "disabled" : input.status;

  const offer = existing
    ? await prisma.offer.update({
        where: { id: existing.id },
        data: {
          title: input.title.trim(),
          description: input.description ?? null,
          offerType: input.offerType,
          code: input.code ?? null,
          affiliateUrl: input.affiliateUrl.trim(),
          status,
          startsAt: input.startsAt ?? null,
          endsAt: input.endsAt ?? null,
          terms: input.terms ?? null,
          isExclusive: input.isExclusive ?? false,
          discountLabel: input.discountLabel ?? null,
          imageUrl: input.imageUrl ?? null,
          identityKey,
          lastIngestedAt: new Date(),
        },
      })
    : await prisma.offer.create({
        data: {
          market,
          merchantId: merchant.id,
          title: input.title.trim(),
          description: input.description ?? null,
          offerType: input.offerType,
          code: input.code ?? null,
          affiliateUrl: input.affiliateUrl.trim(),
          status,
          startsAt: input.startsAt ?? null,
          endsAt: input.endsAt ?? null,
          sourceId: input.sourceId,
          sourceRecordId: input.sourceRecordId,
          identityKey,
          lastIngestedAt: new Date(),
          terms: input.terms ?? null,
          isExclusive: input.isExclusive ?? false,
          discountLabel: input.discountLabel ?? null,
          imageUrl: input.imageUrl ?? null,
        },
      });

  if (input.categorySlugs !== undefined) {
    await applyKnownCategorySlugs(offer.id, input.categorySlugs);
  }

  await prisma.rawSourcePayload.upsert({
    where: {
      sourceId_sourceRecordId: {
        sourceId: input.sourceId,
        sourceRecordId: input.sourceRecordId,
      },
    },
    create: {
      sourceId: input.sourceId,
      sourceRecordId: input.sourceRecordId,
      offerId: offer.id,
      payload: input.rawPayload as object,
      fetchedAt: new Date(),
    },
    update: {
      offerId: offer.id,
      payload: input.rawPayload as object,
      fetchedAt: new Date(),
    },
  });

  return offer;
}

export async function expireUnseenOffers(params: {
  sourceId: SourceId;
  seenRecordIds: string[];
  merchantIds?: string[];
}): Promise<number> {
  const result = await prisma.offer.updateMany({
    where: {
      sourceId: params.sourceId,
      status: "active",
      sourceRecordId: { notIn: params.seenRecordIds },
      ...(params.merchantIds ? { merchantId: { in: params.merchantIds } } : {}),
    },
    data: { status: "expired" },
  });
  return result.count;
}
