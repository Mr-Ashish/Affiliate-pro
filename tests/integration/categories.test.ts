import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createMerchant } from "@/lib/catalog/merchants";
import { createManualOffer } from "@/lib/catalog/offers";
import {
  addOfferToCategory,
  applyKnownCategorySlugs,
  createCategory,
  getPublicCategory,
  listPublicCategories,
  seedStarterCategories,
  setOfferCategories,
} from "@/lib/catalog/categories";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://coupon:coupon@localhost:5434/coupon";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

const createdMerchantIds: string[] = [];
const createdOfferIds: string[] = [];
const createdCategoryIds: string[] = [];

async function dbAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

const hasDb = await dbAvailable();

describe.skipIf(!hasDb)("catalog categories (DB)", () => {
  beforeAll(async () => {
    const market = await prisma.market.findUnique({ where: { code: "US" } });
    if (!market) {
      await prisma.market.create({
        data: { code: "US", name: "United States", defaultLocale: "en-US", isActive: true },
      });
    }
  });

  afterAll(async () => {
    if (createdOfferIds.length > 0) {
      await prisma.offer.deleteMany({ where: { id: { in: createdOfferIds } } });
    }
    if (createdCategoryIds.length > 0) {
      await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
    }
    if (createdMerchantIds.length > 0) {
      await prisma.merchant.deleteMany({ where: { id: { in: createdMerchantIds } } });
    }
    await prisma.$disconnect();
  });

  function uniqueSlug(prefix: string) {
    return `${prefix}-${randomUUID().slice(0, 8)}`;
  }

  async function makeOffer(title = "20% off") {
    const merchant = await createMerchant({
      market: "US",
      slug: uniqueSlug("store"),
      name: "Store Co",
      siteUrl: "https://store.example",
    });
    createdMerchantIds.push(merchant.id);
    const offer = await createManualOffer({
      merchantId: merchant.id,
      title,
      offerType: "coupon",
      code: "SAVE20",
      affiliateUrl: "https://affiliate.example/out",
      status: "active",
    });
    createdOfferIds.push(offer.id);
    return offer;
  }

  it("creates a category and rejects a duplicate slug", async () => {
    const slug = uniqueSlug("beauty");
    const category = await createCategory({ name: "Beauty Test", slug, description: "Test" });
    createdCategoryIds.push(category.id);
    expect(category.slug).toBe(slug);
    await expect(createCategory({ name: "Again", slug: slug.toUpperCase() })).rejects.toThrow(/slug already exists/i);
  });

  it("replaces offer links and ignores unknown ingest slugs", async () => {
    const offer = await makeOffer();
    const first = await createCategory({ name: "One", slug: uniqueSlug("one") });
    const second = await createCategory({ name: "Two", slug: uniqueSlug("two") });
    createdCategoryIds.push(first.id, second.id);
    await setOfferCategories(offer.id, [first.id, second.id]);
    expect(await applyKnownCategorySlugs(offer.id, undefined)).toBeNull();
    expect(await prisma.offerCategory.count({ where: { offerId: offer.id } })).toBe(2);
    await applyKnownCategorySlugs(offer.id, [first.slug, "not-a-real-slug"]);
    const after = await prisma.offerCategory.findMany({ where: { offerId: offer.id } });
    expect(after.map((row) => row.categoryId)).toEqual([first.id]);
    await expect(setOfferCategories(offer.id, [randomUUID()])).rejects.toThrow(/unknown category/i);
  });

  it("lists only active categories that have a live offer", async () => {
    const live = await createCategory({ name: "Live", slug: uniqueSlug("live") });
    const empty = await createCategory({ name: "Empty", slug: uniqueSlug("empty") });
    const hidden = await createCategory({ name: "Hidden", slug: uniqueSlug("hidden"), isActive: false });
    createdCategoryIds.push(live.id, empty.id, hidden.id);
    const offer = await makeOffer("Live deal");
    const draftMerchant = await createMerchant({
      market: "US",
      slug: uniqueSlug("draft-store"),
      name: "Draft Store",
      siteUrl: "https://draft.example",
    });
    createdMerchantIds.push(draftMerchant.id);
    const draft = await createManualOffer({
      merchantId: draftMerchant.id,
      title: "Draft only",
      offerType: "deal",
      affiliateUrl: "https://affiliate.example/draft",
      status: "draft",
    });
    createdOfferIds.push(draft.id);
    await addOfferToCategory(offer.id, live.id);
    await addOfferToCategory(offer.id, hidden.id);
    await addOfferToCategory(draft.id, empty.id);
    const slugs = (await listPublicCategories("US")).map((row) => row.slug);
    expect(slugs).toContain(live.slug);
    expect(slugs).not.toContain(empty.slug);
    expect(slugs).not.toContain(hidden.slug);
    const page = await getPublicCategory("US", live.slug);
    expect(page?.offers.map((row) => row.id)).toEqual([offer.id]);
    expect((await getPublicCategory("US", empty.slug))?.offers).toEqual([]);
    expect(await getPublicCategory("US", hidden.slug)).toBeNull();
  });

  it("does not overwrite an edited starter category", async () => {
    await seedStarterCategories(prisma);
    await prisma.category.update({ where: { slug: "apparel" }, data: { name: "Custom Apparel" } });
    await seedStarterCategories(prisma);
    const again = await prisma.category.findUnique({ where: { slug: "apparel" } });
    expect(again?.name).toBe("Custom Apparel");
    await prisma.category.update({ where: { slug: "apparel" }, data: { name: "Apparel & Accessories" } });
  });
});
