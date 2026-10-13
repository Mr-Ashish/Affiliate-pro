export const DEFAULT_OFFER_IMAGE = "/images/default-offer.png";

export function resolveOfferImageUrl(
  offerImage?: string | null,
  merchantDefault?: string | null,
): string {
  const offer = offerImage?.trim();
  if (offer) return offer;
  const brand = merchantDefault?.trim();
  if (brand) return brand;
  return DEFAULT_OFFER_IMAGE;
}

export function channelLabel(channel?: string | null): string | null {
  switch (channel) {
    case "online":
      return "Online only";
    case "in_store":
      return "In store";
    case "both":
      return "Auto at checkout";
    default:
      return null;
  }
}

export function maskCouponCode(code: string): string {
  const trimmed = code.trim();
  if (trimmed.length <= 2) return "••••";
  return `${trimmed.slice(0, 2)}${"•".repeat(trimmed.length - 2)}`;
}

export function storeTrustStats(
  offers: { createdAt: Date; verifiedAt: Date | null }[],
  now: Date,
): { activeCount: number; addedToday: number; lastVerified: Date | null } {
  const dayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  let lastVerified: Date | null = null;
  let addedToday = 0;
  for (const offer of offers) {
    if (offer.createdAt >= dayStart) addedToday += 1;
    if (
      offer.verifiedAt &&
      (!lastVerified || offer.verifiedAt > lastVerified)
    ) {
      lastVerified = offer.verifiedAt;
    }
  }
  return { activeCount: offers.length, addedToday, lastVerified };
}

export function isBannerLive(
  banner: { isActive: boolean; startsAt: Date | null; endsAt: Date | null },
  now: Date,
): boolean {
  if (!banner.isActive) return false;
  if (banner.startsAt && banner.startsAt > now) return false;
  if (banner.endsAt && banner.endsAt <= now) return false;
  return true;
}

export function bannerHref(banner: {
  linkType: string;
  offerId?: string | null;
  merchantSlug?: string | null;
}): string | null {
  if (banner.linkType === "offer" && banner.offerId) {
    return `/go/${banner.offerId}`;
  }
  if (banner.linkType === "store" && banner.merchantSlug) {
    return `/store/${banner.merchantSlug}`;
  }
  return null;
}
