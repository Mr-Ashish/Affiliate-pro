export type OfferInput = {
  market: string;
  merchantId?: string;
  merchantExternalKey?: string;
  title: string;
  description?: string;
  offerType: "coupon" | "deal" | "sale";
  code?: string | null;
  affiliateUrl: string;
  status?: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

export function validateOfferInput(input: OfferInput): string | null {
  if (!input.market?.trim()) return "market is required";
  if (!input.title?.trim()) return "title is required";
  if (!["coupon", "deal", "sale"].includes(input.offerType)) {
    return "offerType must be coupon, deal, or sale";
  }
  if (!input.affiliateUrl?.trim()) return "affiliateUrl is required";
  try {
    const u = new URL(input.affiliateUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return "affiliateUrl must be http(s)";
    }
  } catch {
    return "affiliateUrl must be an absolute URL";
  }
  if (input.offerType === "coupon" && input.code !== null && input.code !== undefined) {
    if (!String(input.code).trim()) {
      return "coupon code cannot be empty string; use null for no code";
    }
  }
  return null;
}
