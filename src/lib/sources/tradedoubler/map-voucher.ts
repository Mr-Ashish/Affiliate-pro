import { blankToNull } from "@/lib/ingest/blank";
import type { MapResult } from "@/lib/ingest/types";
import { marketFromCurrency } from "@/lib/market/currency";
import type { TradeDoublerVoucher } from "@/lib/sources/tradedoubler/types";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function originFromUrl(value: string | null | undefined): string | null {
  const trimmed = blankToNull(value);
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function mapTradeDoublerVoucher(voucher: TradeDoublerVoucher): MapResult {
  const affiliateUrl = blankToNull(voucher.defaultTrackUri);
  if (!affiliateUrl) {
    return { ok: false, reason: "missing_tracking_url" };
  }

  const market = marketFromCurrency(voucher.currencyId);
  if (!market) {
    return { ok: false, reason: "unknown_market" };
  }

  const merchantSiteUrl = originFromUrl(voucher.landingUrl);
  if (!merchantSiteUrl) {
    return { ok: false, reason: "missing_merchant_site" };
  }

  const isCodeType = voucher.voucherTypeId === 1;
  const code = isCodeType ? blankToNull(voucher.code) : null;
  if (isCodeType && code == null) {
    return { ok: false, reason: "empty_code" };
  }

  return {
    ok: true,
    offer: {
      sourceId: "tradedoubler",
      sourceRecordId: `${voucher.id}:${market}`,
      market,
      merchantExternalId: String(voucher.programId),
      merchantName: voucher.programName,
      merchantSiteUrl,
      title: voucher.title.trim(),
      description: blankToNull(voucher.description),
      offerType: isCodeType && code ? "coupon" : "deal",
      code,
      affiliateUrl,
      startsAt: parseDate(voucher.startDate),
      endsAt: parseDate(voucher.endDate),
      status: "active",
      rawPayload: voucher,
    },
  };
}
