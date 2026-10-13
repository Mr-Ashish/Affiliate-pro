import type { PrismaClient } from "@prisma/client";
import { buildIdentityKey } from "@/lib/catalog/identity";
import type { OfferStatus, OfferType } from "@/lib/catalog/types";

export type DemoMerchant = {
  market: "US";
  slug: string;
  name: string;
  siteUrl: string;
  description: string;
};

export type DemoOffer = {
  merchantSlug: string;
  sourceRecordId: string;
  title: string;
  description: string;
  offerType: OfferType;
  code?: string | null;
  affiliateUrl: string;
  status: OfferStatus;
  isFeatured?: boolean;
  isExclusive?: boolean;
  discountLabel?: string | null;
  /** If set, `endsAt` is now + this many days (for ending-soon badges). */
  endsInDays?: number | null;
  terms?: string | null;
};

const TRUTHY = new Set(["1", "true", "yes", "on"]);

export function shouldSeedDemo(
  argv: string[] = process.argv,
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (argv.includes("--demo")) return true;
  const raw = (env.SEED_DEMO ?? "").trim().toLowerCase();
  return TRUTHY.has(raw);
}

/** Demo catalog is staging/local only. Prod seed stays market + admin. */
export function shouldAllowDemoSeed(envName: string): boolean {
  const name = envName.trim().toLowerCase();
  return name !== "prod" && name !== "production";
}

export const DEMO_MERCHANTS: DemoMerchant[] = [
  {
    market: "US",
    slug: "nike",
    name: "Nike",
    siteUrl: "https://www.nike.com",
    description: "Athletic shoes, apparel, and accessories.",
  },
  {
    market: "US",
    slug: "amazon",
    name: "Amazon",
    siteUrl: "https://www.amazon.com",
    description: "Marketplace for everyday essentials and more.",
  },
  {
    market: "US",
    slug: "target",
    name: "Target",
    siteUrl: "https://www.target.com",
    description: "Home, beauty, grocery, and seasonal deals.",
  },
  {
    market: "US",
    slug: "walmart",
    name: "Walmart",
    siteUrl: "https://www.walmart.com",
    description: "Groceries, household, and pickup savings.",
  },
  {
    market: "US",
    slug: "best-buy",
    name: "Best Buy",
    siteUrl: "https://www.bestbuy.com",
    description: "Consumer electronics, laptops, and appliances.",
  },
  {
    market: "US",
    slug: "adidas",
    name: "Adidas",
    siteUrl: "https://www.adidas.com",
    description: "Sport performance and lifestyle apparel.",
  },
];

export const DEMO_OFFERS: DemoOffer[] = [
  {
    merchantSlug: "nike",
    sourceRecordId: "demo:nike:nike20",
    title: "20% off sitewide",
    description: "Take 20% off eligible full-price styles.",
    offerType: "coupon",
    code: "NIKE20",
    affiliateUrl: "https://www.nike.com",
    status: "active",
    isFeatured: true,
    isExclusive: true,
    discountLabel: "20% Off",
    terms: "Excludes some collaborations. US only.",
  },
  {
    merchantSlug: "nike",
    sourceRecordId: "demo:nike:free-ship",
    title: "Free shipping over $50",
    description: "Standard shipping is free on orders $50+.",
    offerType: "deal",
    code: null,
    affiliateUrl: "https://www.nike.com",
    status: "active",
    isFeatured: true,
    discountLabel: "Free Ship",
  },
  {
    merchantSlug: "nike",
    sourceRecordId: "demo:nike:nike10",
    title: "Extra 10% for members",
    description: "Members save an extra 10% at checkout.",
    offerType: "coupon",
    code: "NIKE10",
    affiliateUrl: "https://www.nike.com",
    status: "active",
    discountLabel: "Extra 10%",
    endsInDays: 2,
  },
  {
    merchantSlug: "amazon",
    sourceRecordId: "demo:amazon:amazon10",
    title: "$10 off $50+",
    description: "Save $10 when you spend $50 or more.",
    offerType: "coupon",
    code: "AMAZON10",
    affiliateUrl: "https://www.amazon.com",
    status: "active",
    discountLabel: "$10 Off",
  },
  {
    merchantSlug: "amazon",
    sourceRecordId: "demo:amazon:prime-day",
    title: "Prime Day electronics sale",
    description: "Featured deals on headphones, tablets, and more.",
    offerType: "sale",
    code: null,
    affiliateUrl: "https://www.amazon.com",
    status: "active",
    isFeatured: true,
    discountLabel: "Prime Day",
  },
  {
    merchantSlug: "target",
    sourceRecordId: "demo:target:target15",
    title: "15% off home",
    description: "Save 15% on select home and furniture.",
    offerType: "coupon",
    code: "TARGET15",
    affiliateUrl: "https://www.target.com",
    status: "active",
    isFeatured: true,
    discountLabel: "15% Off",
  },
  {
    merchantSlug: "target",
    sourceRecordId: "demo:target:circle-week",
    title: "Circle Week sale",
    description: "Weekly Circle deals across grocery and beauty.",
    offerType: "sale",
    code: null,
    affiliateUrl: "https://www.target.com",
    status: "active",
    discountLabel: "Circle Week",
  },
  {
    merchantSlug: "walmart",
    sourceRecordId: "demo:walmart:walmart5",
    title: "$5 off pickup",
    description: "$5 off your first pickup order of $35+.",
    offerType: "coupon",
    code: "WALMART5",
    affiliateUrl: "https://www.walmart.com",
    status: "active",
    isFeatured: true,
    discountLabel: "$5 Off",
  },
  {
    merchantSlug: "walmart",
    sourceRecordId: "demo:walmart:rollback",
    title: "Grocery rollbacks",
    description: "Limited-time rollback prices on pantry staples.",
    offerType: "sale",
    code: null,
    affiliateUrl: "https://www.walmart.com",
    status: "active",
    discountLabel: "Rollback",
  },
  {
    merchantSlug: "best-buy",
    sourceRecordId: "demo:best-buy:bbylaptop",
    title: "10% off laptops",
    description: "Save 10% on select Windows laptops.",
    offerType: "coupon",
    code: "BBYLAPTOP",
    affiliateUrl: "https://www.bestbuy.com",
    status: "active",
    isFeatured: true,
    discountLabel: "10% Off",
    endsInDays: 3,
  },
  {
    merchantSlug: "best-buy",
    sourceRecordId: "demo:best-buy:open-box",
    title: "Open-box headphones",
    description: "Open-box audio gear at reduced prices.",
    offerType: "deal",
    code: null,
    affiliateUrl: "https://www.bestbuy.com",
    status: "active",
    discountLabel: "Open-Box",
  },
  {
    merchantSlug: "adidas",
    sourceRecordId: "demo:adidas:adidas25",
    title: "25% off shoes",
    description: "Take 25% off select footwear.",
    offerType: "coupon",
    code: "ADIDAS25",
    affiliateUrl: "https://www.adidas.com",
    status: "active",
    isFeatured: true,
    isExclusive: true,
    discountLabel: "25% Off",
  },
  {
    merchantSlug: "adidas",
    sourceRecordId: "demo:adidas:outlet20",
    title: "Outlet extra 20% off",
    description: "Extra 20% off already-reduced outlet styles.",
    offerType: "deal",
    code: null,
    affiliateUrl: "https://www.adidas.com",
    status: "active",
    discountLabel: "Extra 20%",
  },
  {
    merchantSlug: "adidas",
    sourceRecordId: "demo:adidas:expired",
    title: "Expired: extra 30% off",
    description: "This promo has ended (admin list sample).",
    offerType: "coupon",
    code: "ADIDASOLD",
    affiliateUrl: "https://www.adidas.com",
    status: "expired",
    discountLabel: "30% Off",
  },
  {
    merchantSlug: "nike",
    sourceRecordId: "demo:nike:draft-fall",
    title: "Draft: fall preview sale",
    description: "Not public yet — draft offer for admin lists.",
    offerType: "sale",
    code: null,
    affiliateUrl: "https://www.nike.com",
    status: "draft",
    discountLabel: "Coming soon",
  },
];

const DEMO_SOURCE_ID = "manual";

export async function seedDemoCatalog(prisma: PrismaClient): Promise<{
  merchants: number;
  offers: number;
}> {
  const merchantIds = new Map<string, string>();

  for (const merchant of DEMO_MERCHANTS) {
    const row = await prisma.merchant.upsert({
      where: {
        market_slug: { market: merchant.market, slug: merchant.slug },
      },
      create: {
        market: merchant.market,
        slug: merchant.slug,
        name: merchant.name,
        siteUrl: merchant.siteUrl,
        description: merchant.description,
        isActive: true,
      },
      update: {
        name: merchant.name,
        siteUrl: merchant.siteUrl,
        description: merchant.description,
        isActive: true,
      },
    });
    merchantIds.set(merchant.slug, row.id);
  }

  const now = new Date();

  for (const offer of DEMO_OFFERS) {
    const merchantId = merchantIds.get(offer.merchantSlug);
    if (!merchantId) {
      throw new Error(`demo merchant missing for slug=${offer.merchantSlug}`);
    }

    const identityKey = buildIdentityKey({
      market: "US",
      merchantExternalKey: offer.merchantSlug,
      offerType: offer.offerType,
      code: offer.code ?? null,
      title: offer.title,
    });

    const endsAt =
      offer.endsInDays != null
        ? new Date(now.getTime() + offer.endsInDays * 24 * 60 * 60 * 1000)
        : null;

    await prisma.offer.upsert({
      where: {
        sourceId_sourceRecordId: {
          sourceId: DEMO_SOURCE_ID,
          sourceRecordId: offer.sourceRecordId,
        },
      },
      create: {
        market: "US",
        merchantId,
        title: offer.title,
        description: offer.description,
        offerType: offer.offerType,
        code: offer.code ?? null,
        affiliateUrl: offer.affiliateUrl,
        status: offer.status,
        isFeatured: offer.isFeatured ?? false,
        isExclusive: offer.isExclusive ?? false,
        discountLabel: offer.discountLabel ?? null,
        terms: offer.terms ?? null,
        endsAt,
        sourceId: DEMO_SOURCE_ID,
        sourceRecordId: offer.sourceRecordId,
        identityKey,
        lastIngestedAt: now,
        verifiedAt: offer.status === "active" ? now : null,
      },
      update: {
        merchantId,
        title: offer.title,
        description: offer.description,
        offerType: offer.offerType,
        code: offer.code ?? null,
        affiliateUrl: offer.affiliateUrl,
        status: offer.status,
        isFeatured: offer.isFeatured ?? false,
        isExclusive: offer.isExclusive ?? false,
        discountLabel: offer.discountLabel ?? null,
        terms: offer.terms ?? null,
        endsAt,
        identityKey,
        lastIngestedAt: now,
      },
    });
  }

  return {
    merchants: DEMO_MERCHANTS.length,
    offers: DEMO_OFFERS.length,
  };
}
