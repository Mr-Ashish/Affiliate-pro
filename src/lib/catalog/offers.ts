import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildIdentityKey } from "@/lib/catalog/identity";
import type {
  CreateManualOfferInput,
  ListActiveOffersInput,
  OfferStatus,
} from "@/lib/catalog/types";
import { validateOfferInput } from "@/lib/ingest/validate";

const OFFER_STATUSES = new Set<OfferStatus>([
  "draft",
  "active",
  "expired",
  "disabled",
]);

export async function createManualOffer(input: CreateManualOfferInput) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: input.merchantId },
  });
  if (!merchant) {
    throw new Error(`merchant not found: ${input.merchantId}`);
  }

  const validationError = validateOfferInput({
    market: merchant.market,
    merchantId: merchant.id,
    title: input.title,
    description: input.description ?? undefined,
    offerType: input.offerType,
    code: input.code,
    affiliateUrl: input.affiliateUrl,
    status: input.status,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  });
  if (validationError) {
    throw new Error(validationError);
  }

  const id = randomUUID();
  const identityKey = buildIdentityKey({
    market: merchant.market,
    merchantExternalKey: merchant.slug,
    offerType: input.offerType,
    code: input.code,
    title: input.title,
  });

  return prisma.offer.create({
    data: {
      id,
      market: merchant.market,
      merchantId: merchant.id,
      title: input.title.trim(),
      description: input.description ?? null,
      offerType: input.offerType,
      code: input.code ?? null,
      affiliateUrl: input.affiliateUrl.trim(),
      status: input.status,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      isFeatured: input.isFeatured ?? false,
      sourceId: "manual",
      sourceRecordId: id,
      identityKey,
      lastIngestedAt: new Date(),
      terms: input.terms ?? null,
      isExclusive: input.isExclusive ?? false,
      discountLabel: input.discountLabel ?? null,
      imageUrl: input.imageUrl ?? null,
      channel: input.channel ?? null,
      verifiedAt: input.verifiedAt ?? null,
    },
  });
}

/** Admin: pause, resume, or retire an offer. Does not delete the row. */
export async function updateOfferStatus(id: string, status: string) {
  const offerId = id.trim();
  if (!offerId) {
    throw new Error("offer id is required");
  }
  if (!OFFER_STATUSES.has(status as OfferStatus)) {
    throw new Error(`invalid status: ${status}`);
  }

  try {
    return await prisma.offer.update({
      where: { id: offerId },
      data: { status },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new Error(`offer not found: ${offerId}`);
    }
    throw err;
  }
}

export async function listActiveOffersForMerchantId(input: {
  merchantId: string;
  market: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const market = input.market.trim();

  return prisma.offer.findMany({
    where: {
      merchantId: input.merchantId,
      market,
      status: "active",
      AND: [
        {
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        },
        {
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
      ],
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });
}

export async function listActiveOffersForStore(input: ListActiveOffersInput) {
  const market = input.market.trim();
  const slug = input.slug.trim().toLowerCase();

  const merchant = await prisma.merchant.findUnique({
    where: {
      market_slug: { market, slug },
    },
  });

  if (!merchant || !merchant.isActive) {
    return [];
  }

  return listActiveOffersForMerchantId({
    merchantId: merchant.id,
    market,
    now: input.now,
  });
}

/** Admin listing — all offers with merchant name, newest first. */
export async function listOffers() {
  return prisma.offer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      merchant: {
        select: { id: true, name: true, slug: true, market: true },
      },
    },
  });
}

function activeDateWindow(now: Date) {
  return {
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    ],
  };
}

const publicOfferCardSelect = {
  id: true,
  title: true,
  description: true,
  code: true,
  offerType: true,
  status: true,
  endsAt: true,
  isFeatured: true,
  isExclusive: true,
  discountLabel: true,
  verifiedAt: true,
  clickCount: true,
  createdAt: true,
  imageUrl: true,
  terms: true,
  channel: true,
} as const;

const publicMerchantCardSelect = {
  id: true,
  name: true,
  slug: true,
  market: true,
  logoUrl: true,
  defaultOfferImageUrl: true,
} as const;

/** Public: featured active offers for a market (newest first). */
export async function listFeaturedOffers(params: {
  market: string;
  limit?: number;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const market = params.market.trim();
  const take = params.limit ?? 8;

  return prisma.offer.findMany({
    where: {
      market,
      isFeatured: true,
      status: "active",
      ...activeDateWindow(now),
      merchant: { isActive: true },
    },
    select: {
      ...publicOfferCardSelect,
      merchant: { select: publicMerchantCardSelect },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** Public: exclusive active offers for a market (verified first). */
export async function listExclusiveOffers(params: {
  market: string;
  limit?: number;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const market = params.market.trim();
  const take = params.limit ?? 8;

  return prisma.offer.findMany({
    where: {
      market,
      isExclusive: true,
      status: "active",
      ...activeDateWindow(now),
      merchant: { isActive: true },
    },
    select: {
      ...publicOfferCardSelect,
      merchant: { select: publicMerchantCardSelect },
    },
    orderBy: [
      { verifiedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    take,
  });
}

/** Public: recently created active offers for a market. */
export async function listRecentOffers(params: {
  market: string;
  limit?: number;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const market = params.market.trim();
  const take = params.limit ?? 10;

  return prisma.offer.findMany({
    where: {
      market,
      status: "active",
      ...activeDateWindow(now),
      merchant: { isActive: true },
    },
    select: {
      ...publicOfferCardSelect,
      merchant: { select: publicMerchantCardSelect },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** Public: active offers ranked by click count. */
export async function listTrendingOffers(params: {
  market: string;
  limit?: number;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const market = params.market.trim();
  const take = params.limit ?? 8;

  return prisma.offer.findMany({
    where: {
      market,
      status: "active",
      ...activeDateWindow(now),
      merchant: { isActive: true },
    },
    select: {
      ...publicOfferCardSelect,
      merchant: { select: publicMerchantCardSelect },
    },
    orderBy: [{ clickCount: "desc" }, { createdAt: "desc" }],
    take,
  });
}

/** Latest click time per offer. Missing ids have no clicks. */
export async function latestClickAtByOfferId(offerIds: string[]) {
  const ids = [...new Set(offerIds.filter(Boolean))];
  const map = new Map<string, Date>();
  if (ids.length === 0) return map;
  const rows = await prisma.clickEvent.groupBy({
    by: ["offerId"],
    where: { offerId: { in: ids } },
    _max: { createdAt: true },
  });
  for (const row of rows) {
    if (row._max.createdAt) map.set(row.offerId, row._max.createdAt);
  }
  return map;
}

/** Admin: top offers by click count. */
export async function listTopOffersByClicks(limit = 10) {
  return prisma.offer.findMany({
    orderBy: { clickCount: "desc" },
    take: limit,
    include: {
      merchant: {
        select: { id: true, name: true, slug: true, market: true },
      },
    },
  });
}

/** Admin dashboard overview counts. */
export async function getAdminDashboardStats() {
  const [activeOffers, expiredOffers, draftOffers, merchantCount] =
    await Promise.all([
      prisma.offer.count({ where: { status: "active" } }),
      prisma.offer.count({ where: { status: "expired" } }),
      prisma.offer.count({ where: { status: "draft" } }),
      prisma.merchant.count(),
    ]);

  return { activeOffers, expiredOffers, draftOffers, merchantCount };
}
