export type OfferType = "coupon" | "deal" | "sale";

export type OfferStatus = "draft" | "active" | "expired" | "disabled";

export type CreateMerchantInput = {
  market: string;
  slug: string;
  name: string;
  siteUrl: string;
  logoUrl?: string | null;
  description?: string | null;
  isActive?: boolean;
};

export type CreateManualOfferInput = {
  merchantId: string;
  title: string;
  description?: string | null;
  offerType: OfferType;
  code?: string | null;
  affiliateUrl: string;
  status: OfferStatus;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isFeatured?: boolean;
  terms?: string | null;
  isExclusive?: boolean;
  discountLabel?: string | null;
  imageUrl?: string | null;
};

export type ListActiveOffersInput = {
  market: string;
  slug: string;
  now?: Date;
};
