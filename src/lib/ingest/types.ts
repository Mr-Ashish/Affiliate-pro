import type { OfferType } from "@/lib/catalog/types";

export type SourceId = "awin" | "admitad" | "impact" | "tradedoubler";

export type MapSkipReason =
  | "not_joined"
  | "missing_tracking_url"
  | "unknown_market"
  | "empty_code"
  | "missing_merchant_site"
  | "unusable";

export type NormalizedOfferInput = {
  sourceId: SourceId;
  sourceRecordId: string;
  market: string;
  merchantExternalId: string;
  merchantName: string;
  merchantSiteUrl?: string | null;
  merchantLogoUrl?: string | null;
  title: string;
  description?: string | null;
  terms?: string | null;
  offerType: OfferType;
  code?: string | null;
  affiliateUrl: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isExclusive?: boolean;
  discountLabel?: string | null;
  imageUrl?: string | null;
  status: "active";
  rawPayload: unknown;
  /** When set, replace offer categories with known slugs. Omit to leave links unchanged. */
  categorySlugs?: string[];
};

export type MapResult =
  | { ok: true; offer: NormalizedOfferInput }
  | { ok: false; reason: MapSkipReason };
