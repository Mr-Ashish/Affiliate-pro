import { blankToNull } from "@/lib/ingest/blank";
import type { MapResult, NormalizedOfferInput } from "@/lib/ingest/types";
import type { AwinProgramme, AwinPromotion } from "@/lib/sources/awin/types";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function asCountryCode(value: string | null | undefined): string | null {
  const code = value?.trim().toUpperCase();
  return code && /^[A-Z]{2}$/.test(code) ? code : null;
}

export function marketsForAwinPromotion(
  promotion: AwinPromotion,
  programme: AwinProgramme | null,
): string[] {
  const listed = [
    ...new Set(
      (promotion.regions?.list ?? [])
        .map((region) => asCountryCode(region.countryCode))
        .filter((code): code is string => code != null),
    ),
  ];
  if (listed.length > 0) return listed;
  const primary = asCountryCode(programme?.primaryRegion?.countryCode);
  return primary ? [primary] : [];
}

function mapForMarket(
  promotion: AwinPromotion,
  programme: AwinProgramme | null,
  market: string,
  affiliateUrl: string,
  merchantSiteUrl: string,
): MapResult {
  const isVoucher = promotion.type === "voucher";
  const code = isVoucher ? blankToNull(promotion.voucher?.code) : null;
  if (isVoucher && promotion.voucher && code == null) {
    return { ok: false, reason: "empty_code" };
  }

  const offer: NormalizedOfferInput = {
    sourceId: "awin",
    sourceRecordId: `${promotion.promotionId}:${market}`,
    market,
    merchantExternalId: String(promotion.advertiser.id),
    merchantName: promotion.advertiser.name,
    merchantSiteUrl,
    merchantLogoUrl: blankToNull(programme?.logoUrl) ?? null,
    title: promotion.title.trim(),
    description: blankToNull(promotion.description),
    terms: blankToNull(promotion.terms),
    offerType: isVoucher && code ? "coupon" : "deal",
    code,
    affiliateUrl,
    startsAt: parseDate(promotion.startDate),
    endsAt: parseDate(promotion.endDate),
    isExclusive: promotion.voucher?.exclusive === true,
    status: "active",
    rawPayload: promotion,
  };
  return { ok: true, offer };
}

export function mapAwinPromotions(
  promotion: AwinPromotion,
  programme: AwinProgramme | null,
): MapResult[] {
  if (!promotion.advertiser?.joined) {
    return [{ ok: false, reason: "not_joined" }];
  }

  const affiliateUrl = blankToNull(promotion.urlTracking);
  if (!affiliateUrl) {
    return [{ ok: false, reason: "missing_tracking_url" }];
  }

  const markets = marketsForAwinPromotion(promotion, programme);
  if (markets.length === 0) {
    return [{ ok: false, reason: "unknown_market" }];
  }

  const merchantSiteUrl = blankToNull(programme?.displayUrl);
  if (!merchantSiteUrl) {
    return [{ ok: false, reason: "missing_merchant_site" }];
  }

  return markets.map((market) =>
    mapForMarket(promotion, programme, market, affiliateUrl, merchantSiteUrl),
  );
}
