import { describe, expect, it } from "vitest";
import { mapAwinPromotions } from "@/lib/sources/awin/map-promotion";
import type { AwinProgramme, AwinPromotion } from "@/lib/sources/awin/types";

const usProgramme: AwinProgramme = {
  id: 111,
  name: "Nike US",
  displayUrl: "https://www.nike.com",
  logoUrl: "https://cdn.example.com/nike.png",
  primaryRegion: { countryCode: "US", name: "United States" },
};

const ukProgramme: AwinProgramme = {
  id: 26263,
  name: "Angara UK",
  displayUrl: "https://www.angara.com",
  logoUrl: null,
  primaryRegion: { countryCode: "GB", name: "United Kingdom" },
};

function promotion(
  overrides: Partial<AwinPromotion> & Pick<AwinPromotion, "promotionId" | "type">,
): AwinPromotion {
  return {
    title: "20% off sitewide",
    description: "Save 20%",
    terms: "Exclusions apply",
    startDate: "2026-11-01T00:00:00+00:00",
    endDate: "2026-12-01T00:00:00+00:00",
    url: "https://www.nike.com/sale",
    urlTracking: "https://www.awin1.com/cread.php?awinmid=111&awinaffid=1",
    advertiser: { id: 111, name: "Nike US", joined: true },
    regions: { all: false, list: [{ countryCode: "US", name: "United States" }] },
    ...overrides,
  };
}

describe("mapAwinPromotions", () => {
  it("maps a joined US voucher to a coupon with market-suffixed id", () => {
    const results = mapAwinPromotions(
      promotion({
        promotionId: 1001,
        type: "voucher",
        voucher: { code: "SAVE20", exclusive: true, attributable: false },
      }),
      usProgramme,
    );

    expect(results).toHaveLength(1);
    const result = results[0];
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.offer.sourceId).toBe("awin");
    expect(result.offer.market).toBe("US");
    expect(result.offer.sourceRecordId).toBe("1001:US");
    expect(result.offer.offerType).toBe("coupon");
    expect(result.offer.code).toBe("SAVE20");
    expect(result.offer.isExclusive).toBe(true);
    expect(result.offer.affiliateUrl).toContain("awin1.com");
    expect(result.offer.merchantExternalId).toBe("111");
    expect(result.offer.merchantSiteUrl).toBe("https://www.nike.com");
    expect(result.offer.status).toBe("active");
  });

  it("maps a promotion without voucher to a deal with null code", () => {
    const results = mapAwinPromotions(
      promotion({
        promotionId: 1002,
        type: "promotion",
        description: "Use Code: SECRET99 in the copy",
      }),
      usProgramme,
    );
    expect(results).toHaveLength(1);
    const result = results[0];
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.offer.offerType).toBe("deal");
    expect(result.offer.code).toBeNull();
    expect(result.offer.description).toContain("SECRET99");
  });

  it("skips unjoined advertisers", () => {
    expect(
      mapAwinPromotions(
        promotion({
          promotionId: 1003,
          type: "voucher",
          advertiser: { id: 111, name: "Nike US", joined: false },
          voucher: { code: null, exclusive: false, attributable: false },
        }),
        usProgramme,
      ),
    ).toEqual([{ ok: false, reason: "not_joined" }]);
  });

  it("skips missing tracking URL", () => {
    expect(
      mapAwinPromotions(
        promotion({
          promotionId: 1004,
          type: "promotion",
          urlTracking: "",
        }),
        usProgramme,
      ),
    ).toEqual([{ ok: false, reason: "missing_tracking_url" }]);
  });

  it("maps regions.all to the programme primary region, including non-US", () => {
    const results = mapAwinPromotions(
      promotion({
        promotionId: 4156176,
        type: "promotion",
        advertiser: { id: 26263, name: "Angara UK", joined: true },
        regions: { all: true },
        urlTracking: "https://www.awin1.com/cread.php?awinmid=26263",
      }),
      ukProgramme,
    );
    expect(results).toHaveLength(1);
    const result = results[0];
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.offer.market).toBe("GB");
    expect(result.offer.sourceRecordId).toBe("4156176:GB");
  });

  it("skips regions.all when no programme country is supplied", () => {
    expect(
      mapAwinPromotions(
        promotion({
          promotionId: 1005,
          type: "promotion",
          regions: { all: true },
        }),
        null,
      ),
    ).toEqual([{ ok: false, reason: "unknown_market" }]);
  });

  it("emits one offer per listed country", () => {
    const results = mapAwinPromotions(
      promotion({
        promotionId: 4156176,
        type: "promotion",
        advertiser: { id: 26263, name: "Angara UK", joined: true },
        regions: {
          all: false,
          list: [
            { countryCode: "US", name: "United States" },
            { countryCode: "GB", name: "United Kingdom" },
          ],
        },
        urlTracking: "https://www.awin1.com/cread.php?awinmid=26263",
      }),
      ukProgramme,
    );
    expect(results).toHaveLength(2);
    const markets = results.flatMap((result) =>
      result.ok ? [result.offer.market] : [],
    );
    expect(markets).toEqual(["US", "GB"]);
    expect(results[0].ok && results[0].offer.sourceRecordId).toBe("4156176:US");
    expect(results[1].ok && results[1].offer.sourceRecordId).toBe("4156176:GB");
  });

  it("treats N/A and blank terms as null", () => {
    const results = mapAwinPromotions(
      promotion({ promotionId: 1007, type: "promotion", terms: "N/A" }),
      usProgramme,
    );
    expect(results[0].ok).toBe(true);
    if (!results[0].ok) return;
    expect(results[0].offer.terms).toBeNull();
  });

  it("skips when the programme has no display URL", () => {
    expect(
      mapAwinPromotions(
        promotion({ promotionId: 1009, type: "promotion" }),
        { ...usProgramme, displayUrl: "  " },
      ),
    ).toEqual([{ ok: false, reason: "missing_merchant_site" }]);
  });

  it("skips voucher with empty code string", () => {
    expect(
      mapAwinPromotions(
        promotion({
          promotionId: 1008,
          type: "voucher",
          voucher: { code: "  ", exclusive: false, attributable: false },
        }),
        usProgramme,
      ),
    ).toEqual([{ ok: false, reason: "empty_code" }]);
  });
});
