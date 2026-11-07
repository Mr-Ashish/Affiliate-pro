import { channelLabel, resolveOfferImageUrl } from "@/lib/catalog/offer-display";
import { isEndingSoon } from "@/lib/ui/ending-soon";
import type { BadgeTone } from "@/components/ui/Badge";

export type OfferLike = {
  id: string;
  title: string;
  description?: string | null;
  code?: string | null;
  offerType: string;
  status: string;
  endsAt?: Date | string | null;
  isFeatured?: boolean;
  isExclusive?: boolean;
  discountLabel?: string | null;
  verifiedAt?: Date | string | null;
  clickCount?: number;
  imageUrl?: string | null;
  terms?: string | null;
  channel?: string | null;
};

export type MerchantLike = {
  id?: string;
  name: string;
  slug: string;
  market?: string;
  logoUrl?: string | null;
  description?: string | null;
  defaultOfferImageUrl?: string | null;
  siteUrl?: string;
};

export type DealCardViewModel = {
  id: string;
  title: string;
  description: string | null;
  merchantName: string;
  merchantSlug: string;
  merchantLogoUrl: string | null;
  code: string | null;
  goHref: string;
  ctaLabel: "Get Code" | "Shop Deal";
  badges: { label: string; tone: BadgeTone }[];
  verifiedAt: Date | null;
  discountLabel: string | null;
  imageUrl: string;
  terms: string | null;
  channelLabel: string | null;
  clickCount: number;
  offerType: string;
};

export type OfferRowViewModel = {
  id: string;
  title: string;
  merchantName: string;
  merchantSlug: string;
  code: string | null;
  goHref: string;
  ctaLabel: "Get Code" | "Shop Deal";
  badges: { label: string; tone: BadgeTone }[];
};

function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function offerCtaLabel(code: string | null | undefined): "Get Code" | "Shop Deal" {
  return code && code.trim().length > 0 ? "Get Code" : "Shop Deal";
}

export function offerBadges(
  offer: OfferLike,
  now: Date = new Date(),
): { label: string; tone: BadgeTone }[] {
  const badges: { label: string; tone: BadgeTone }[] = [];
  if (offer.isFeatured) badges.push({ label: "Featured", tone: "featured" });
  if (offer.isExclusive) badges.push({ label: "Exclusive", tone: "exclusive" });
  if (isEndingSoon(offer.endsAt, now)) {
    badges.push({ label: "Ending Soon", tone: "ending-soon" });
  } else if (offer.status === "active") {
    badges.push({ label: "Active", tone: "active" });
  } else if (offer.status === "expired") {
    badges.push({ label: "Expired", tone: "expired" });
  } else if (offer.status === "draft") {
    badges.push({ label: "Draft", tone: "draft" });
  }
  return badges;
}

export function toDealCardViewModel(
  offer: OfferLike,
  merchant: MerchantLike,
  now: Date = new Date(),
): DealCardViewModel {
  return {
    id: offer.id,
    title: offer.title,
    description: offer.description ?? null,
    merchantName: merchant.name,
    merchantSlug: merchant.slug,
    merchantLogoUrl: merchant.logoUrl ?? null,
    code: offer.code ?? null,
    goHref: `/go/${offer.id}`,
    ctaLabel: offerCtaLabel(offer.code),
    badges: offerBadges(offer, now),
    verifiedAt: parseDate(offer.verifiedAt),
    discountLabel: offer.discountLabel ?? null,
    imageUrl: resolveOfferImageUrl(offer.imageUrl, merchant.defaultOfferImageUrl),
    terms: offer.terms ?? null,
    channelLabel: channelLabel(offer.channel),
    clickCount: offer.clickCount ?? 0,
    offerType: offer.offerType,
  };
}

export function toOfferRowViewModel(
  offer: OfferLike,
  merchant: MerchantLike,
  now: Date = new Date(),
): OfferRowViewModel {
  return {
    id: offer.id,
    title: offer.title,
    merchantName: merchant.name,
    merchantSlug: merchant.slug,
    code: offer.code ?? null,
    goHref: `/go/${offer.id}`,
    ctaLabel: offerCtaLabel(offer.code),
    badges: offerBadges(offer, now),
  };
}

export function statusBadgeTone(status: string): BadgeTone {
  switch (status) {
    case "active":
      return "active";
    case "expired":
      return "expired";
    case "draft":
      return "draft";
    default:
      return "neutral";
  }
}
