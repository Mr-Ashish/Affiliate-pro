import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertCategorySlug } from "@/lib/catalog/category-slug";
import { STARTER_CATEGORIES } from "@/lib/catalog/starter-categories";

export type CategoryWriteInput = {
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type CategoryAssignResult = {
  offerId: string;
  categoryIds: string[];
  affectedSlugs: string[];
};

function cleanName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("name is required");
  return trimmed;
}

function cleanSort(sortOrder: number | undefined): number {
  if (sortOrder == null || Number.isNaN(sortOrder)) return 0;
  return Math.trunc(sortOrder);
}

function activeOfferWhere(market: string, now: Date): Prisma.OfferWhereInput {
  return {
    market,
    status: "active",
    merchant: { isActive: true },
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    ],
  };
}

async function slugsForIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.category.findMany({
    where: { id: { in: ids } },
    select: { slug: true },
  });
  return rows.map((row) => row.slug);
}

export async function createCategory(input: CategoryWriteInput) {
  const slug = assertCategorySlug(input.slug);
  const name = cleanName(input.name);
  try {
    return await prisma.category.create({
      data: {
        name,
        slug,
        description: input.description?.trim() || null,
        sortOrder: cleanSort(input.sortOrder),
        isActive: input.isActive ?? true,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error(`slug already exists: ${slug}`);
    }
    throw err;
  }
}

export async function updateCategory(id: string, input: CategoryWriteInput) {
  const categoryId = id.trim();
  if (!categoryId) throw new Error("category id is required");
  const slug = assertCategorySlug(input.slug);
  const name = cleanName(input.name);
  try {
    return await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        slug,
        description: input.description?.trim() || null,
        sortOrder: cleanSort(input.sortOrder),
        isActive: input.isActive ?? true,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") throw new Error(`slug already exists: ${slug}`);
      if (err.code === "P2025") throw new Error(`category not found: ${categoryId}`);
    }
    throw err;
  }
}

export async function listCategoriesAdmin() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { offers: true } } },
  });
}

export async function getCategoryAdmin(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      offers: {
        include: {
          offer: {
            select: {
              id: true,
              title: true,
              status: true,
              market: true,
              merchant: { select: { name: true } },
            },
          },
        },
        orderBy: { offer: { title: "asc" } },
      },
    },
  });
}

export async function listActiveCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  });
}

export async function setOfferCategories(
  offerId: string,
  categoryIds: string[],
): Promise<CategoryAssignResult> {
  const id = offerId.trim();
  const offer = await prisma.offer.findUnique({ where: { id }, select: { id: true } });
  if (!offer) throw new Error(`offer not found: ${id}`);
  const unique = [...new Set(categoryIds.map((value) => value.trim()).filter(Boolean))];
  if (unique.length > 0) {
    const found = await prisma.category.findMany({
      where: { id: { in: unique } },
      select: { id: true },
    });
    if (found.length !== unique.length) throw new Error("unknown category");
  }
  const before = await prisma.offerCategory.findMany({
    where: { offerId: id },
    select: { categoryId: true },
  });
  await prisma.$transaction([
    prisma.offerCategory.deleteMany({ where: { offerId: id } }),
    ...(unique.length > 0
      ? [prisma.offerCategory.createMany({
          data: unique.map((categoryId) => ({ offerId: id, categoryId })),
        })]
      : []),
  ]);
  const affectedSlugs = await slugsForIds([...before.map((row) => row.categoryId), ...unique]);
  return { offerId: id, categoryIds: unique, affectedSlugs };
}

export async function addOfferToCategory(offerId: string, categoryId: string): Promise<CategoryAssignResult> {
  const offer = await prisma.offer.findUnique({ where: { id: offerId }, select: { id: true } });
  if (!offer) throw new Error(`offer not found: ${offerId}`);
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, slug: true },
  });
  if (!category) throw new Error(`category not found: ${categoryId}`);
  await prisma.offerCategory.upsert({
    where: { offerId_categoryId: { offerId, categoryId } },
    create: { offerId, categoryId },
    update: {},
  });
  return { offerId, categoryIds: [categoryId], affectedSlugs: [category.slug] };
}

export async function removeOfferFromCategory(offerId: string, categoryId: string): Promise<CategoryAssignResult> {
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
  await prisma.offerCategory.deleteMany({ where: { offerId, categoryId } });
  return { offerId, categoryIds: [], affectedSlugs: category ? [category.slug] : [] };
}

export async function applyKnownCategorySlugs(
  offerId: string,
  slugs: string[] | undefined,
): Promise<CategoryAssignResult | null> {
  if (slugs === undefined) return null;
  const normalized = [...new Set(slugs.map((slug) => slug.trim().toLowerCase()).filter(Boolean))];
  const found = normalized.length === 0
    ? []
    : await prisma.category.findMany({ where: { slug: { in: normalized } }, select: { id: true } });
  return setOfferCategories(offerId, found.map((row) => row.id));
}

export async function searchOffersForAssign(query: string, limit = 20) {
  const q = query.trim();
  if (q.length < 2) return [];
  return prisma.offer.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { merchant: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: { merchant: { select: { name: true, market: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listPublicCategories(market: string, now = new Date()) {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      offers: {
        where: { offer: activeOfferWhere(market.trim(), now) },
        select: { offerId: true },
      },
    },
  });
  return rows
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      offerCount: row.offers.length,
    }))
    .filter((row) => row.offerCount > 0);
}

export async function getPublicCategory(market: string, slug: string, now = new Date()) {
  const category = await prisma.category.findUnique({
    where: { slug: slug.trim().toLowerCase() },
  });
  if (!category || !category.isActive) return null;
  const offers = await prisma.offer.findMany({
    where: {
      ...activeOfferWhere(market.trim(), now),
      categories: { some: { categoryId: category.id } },
    },
    include: {
      merchant: {
        select: {
          name: true,
          slug: true,
          market: true,
          logoUrl: true,
          defaultOfferImageUrl: true,
        },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });
  return { category, offers };
}

export async function listCategoryLinksForOffers(offerIds: string[]) {
  if (offerIds.length === 0) return [];
  return prisma.offerCategory.findMany({
    where: { offerId: { in: offerIds }, category: { isActive: true } },
    select: { offerId: true, category: { select: { slug: true, name: true } } },
  });
}

export async function seedStarterCategories(client: PrismaClient = prisma) {
  let created = 0;
  for (const row of STARTER_CATEGORIES) {
    const existing = await client.category.findUnique({
      where: { slug: row.slug },
      select: { id: true },
    });
    if (existing) continue;
    await client.category.create({
      data: {
        slug: row.slug,
        name: row.name,
        description: row.description,
        sortOrder: row.sortOrder,
        isActive: true,
      },
    });
    created += 1;
  }
  return { created };
}
