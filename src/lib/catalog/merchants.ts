import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CreateMerchantInput } from "@/lib/catalog/types";

export async function createMerchant(input: CreateMerchantInput) {
  const market = input.market.trim();
  const slug = input.slug.trim().toLowerCase();
  const name = input.name.trim();
  const siteUrl = input.siteUrl.trim();

  if (!market) throw new Error("market is required");
  if (!slug) throw new Error("slug is required");
  if (!name) throw new Error("name is required");
  if (!siteUrl) throw new Error("siteUrl is required");

  try {
    return await prisma.merchant.create({
      data: {
        market,
        slug,
        name,
        siteUrl,
        logoUrl: input.logoUrl ?? null,
        description: input.description ?? null,
        defaultOfferImageUrl: input.defaultOfferImageUrl ?? null,
        isActive: input.isActive ?? true,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new Error(
        `merchant already exists for market=${market} slug=${slug}`,
      );
    }
    throw err;
  }
}

export async function getMerchantBySlug(params: {
  market: string;
  slug: string;
}) {
  return prisma.merchant.findUnique({
    where: {
      market_slug: {
        market: params.market.trim(),
        slug: params.slug.trim().toLowerCase(),
      },
    },
  });
}

export async function getMerchantSlugById(
  id: string,
): Promise<string | null> {
  const row = await prisma.merchant.findUnique({
    where: { id },
    select: { slug: true },
  });
  return row?.slug ?? null;
}

/** Admin listing — all merchants, newest first. */
export async function listMerchants() {
  return prisma.merchant.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/** Public: count of active merchants in a market. */
export async function countActiveMerchants(params: { market: string }) {
  const market = params.market.trim();
  return prisma.merchant.count({
    where: { market, isActive: true },
  });
}

/** Public: active merchants for directory listing. */
export async function listActiveMerchants(params: {
  market: string;
  limit?: number;
  q?: string;
}) {
  const market = params.market.trim();
  const q = params.q?.trim();
  return prisma.merchant.findMany({
    where: {
      market,
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: params.limit,
  });
}

type PopularMerchantRow = {
  id: string;
  market: string;
  slug: string;
  name: string;
  site_url: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  offer_count: number;
};

/**
 * Public: popular merchants ordered by active offer count (then name).
 * Ranked in SQL so we do not load every merchant into the app.
 */
export async function listPopularMerchants(params: {
  market: string;
  limit?: number;
  now?: Date;
}) {
  const market = params.market.trim();
  const take = Math.max(1, Math.min(200, Math.floor(params.limit ?? 12)));
  const now = params.now ?? new Date();

  const rows = await prisma.$queryRaw<PopularMerchantRow[]>(Prisma.sql`
    SELECT
      m.id,
      m.market,
      m.slug,
      m.name,
      m.site_url,
      m.logo_url,
      m.description,
      m.is_active,
      COUNT(o.id)::int AS offer_count
    FROM merchants m
    LEFT JOIN offers o
      ON o.merchant_id = m.id
     AND o.status = 'active'
     AND (o.starts_at IS NULL OR o.starts_at <= ${now})
     AND (o.ends_at IS NULL OR o.ends_at > ${now})
    WHERE m.market = ${market}
      AND m.is_active = true
    GROUP BY m.id
    ORDER BY offer_count DESC, m.name ASC
    LIMIT ${take}
  `);

  return rows.map((m) => ({
    id: m.id,
    market: m.market,
    slug: m.slug,
    name: m.name,
    siteUrl: m.site_url,
    logoUrl: m.logo_url,
    description: m.description,
    isActive: m.is_active,
    offerCount: m.offer_count,
  }));
}

/** Admin: merchants with offer counts for table. */
export async function listMerchantsWithOfferCounts() {
  const rows = await prisma.merchant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { offers: true } },
    },
  });
  return rows.map((m) => ({
    ...m,
    offerCount: m._count.offers,
  }));
}

export async function listDirectoryMerchants(params: {
  market: string;
  q?: string;
}) {
  const market = params.market.trim();
  const q = params.q?.trim();
  const rows = await prisma.merchant.findMany({
    where: {
      market,
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { offers: { where: { status: "active" } } } },
    },
  });
  return rows.map((merchant) => ({
    ...merchant,
    offerCount: merchant._count.offers,
  }));
}
