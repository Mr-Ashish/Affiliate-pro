import { describe, expect, it } from "vitest";
import { mapTradeDoublerVoucher } from "@/lib/sources/tradedoubler/map-voucher";
import type { TradeDoublerVoucher } from "@/lib/sources/tradedoubler/types";

function voucher(
  overrides: Partial<TradeDoublerVoucher> = {},
): TradeDoublerVoucher {
  return {
    id: 9001,
    programId: 42,
    programName: "Example Shop",
    voucherTypeId: 1,
    title: "10% off sitewide",
    description: "Save 10 percent",
    defaultTrackUri: "https://clk.tradedoubler.com/click?p=42",
    landingUrl: "https://www.example.com/sale?ref=td",
    currencyId: "USD",
    languageId: "en",
    code: "SAVE10",
    startDate: "2026-11-01T00:00:00+00:00",
    endDate: "2026-12-01T00:00:00+00:00",
    ...overrides,
  };
}

describe("mapTradeDoublerVoucher", () => {
  it("maps a USD code voucher to a US coupon", () => {
    const result = mapTradeDoublerVoucher(voucher());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.offer.sourceId).toBe("tradedoubler");
    expect(result.offer.market).toBe("US");
    expect(result.offer.sourceRecordId).toBe("9001:US");
    expect(result.offer.offerType).toBe("coupon");
    expect(result.offer.code).toBe("SAVE10");
    expect(result.offer.merchantExternalId).toBe("42");
    expect(result.offer.merchantSiteUrl).toBe("https://www.example.com");
  });

  it("maps GBP discount-without-code to a GB deal", () => {
    const result = mapTradeDoublerVoucher(
      voucher({
        voucherTypeId: 2,
        currencyId: "GBP",
        code: null,
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.offer.market).toBe("GB");
    expect(result.offer.sourceRecordId).toBe("9001:GB");
    expect(result.offer.offerType).toBe("deal");
    expect(result.offer.code).toBeNull();
  });

  it("maps EUR to the EU market", () => {
    const result = mapTradeDoublerVoucher(voucher({ currencyId: "EUR" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.offer.market).toBe("EU");
  });

  it("skips unknown currency", () => {
    expect(mapTradeDoublerVoucher(voucher({ currencyId: "XXX" }))).toEqual({
      ok: false,
      reason: "unknown_market",
    });
  });

  it("skips missing tracking URL", () => {
    expect(mapTradeDoublerVoucher(voucher({ defaultTrackUri: " " }))).toEqual({
      ok: false,
      reason: "missing_tracking_url",
    });
  });

  it("skips missing landing URL origin", () => {
    expect(mapTradeDoublerVoucher(voucher({ landingUrl: "not-a-url" }))).toEqual({
      ok: false,
      reason: "missing_merchant_site",
    });
  });

  it("skips type-1 voucher with empty code", () => {
    expect(mapTradeDoublerVoucher(voucher({ code: "  " }))).toEqual({
      ok: false,
      reason: "empty_code",
    });
  });
});
