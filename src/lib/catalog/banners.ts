import { prisma } from "@/lib/db";

export async function listActiveBanners(params: { market: string; now?: Date }) {
  const now = params.now ?? new Date();
  const market = params.market.trim();
  return prisma.banner.findMany({
    where: {
      market,
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      offer: { select: { id: true, code: true, title: true, isExclusive: true } },
      merchant: { select: { slug: true, name: true } },
    },
  });
}

export async function listBanners() {
  return prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      offer: { select: { id: true, title: true } },
      merchant: { select: { id: true, name: true, slug: true } },
    },
  });
}

export type CreateBannerInput = {
  market: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  ctaLabel: string;
  linkType: "offer" | "store";
  offerId?: string | null;
  merchantId?: string | null;
  sortOrder?: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
  isSponsored?: boolean;
};

export async function createBanner(input: CreateBannerInput) {
  const title = input.title.trim();
  const imageUrl = input.imageUrl.trim();
  const ctaLabel = input.ctaLabel.trim();
  if (!title) throw new Error("title is required");
  if (!imageUrl) throw new Error("imageUrl is required");
  if (!ctaLabel) throw new Error("ctaLabel is required");
  if (input.linkType === "offer" && !input.offerId) {
    throw new Error("offer is required");
  }
  if (input.linkType === "store" && !input.merchantId) {
    throw new Error("store is required");
  }
  return prisma.banner.create({
    data: {
      market: input.market.trim() || "US",
      title,
      subtitle: input.subtitle?.trim() || null,
      imageUrl,
      ctaLabel,
      linkType: input.linkType,
      offerId: input.linkType === "offer" ? input.offerId : null,
      merchantId: input.linkType === "store" ? input.merchantId : null,
      sortOrder: input.sortOrder ?? 0,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      isActive: input.isActive ?? true,
      isSponsored: input.isSponsored ?? false,
    },
  });
}
