import { describe, expect, it } from "vitest";
import {
  bannerHref,
  channelLabel,
  isBannerLive,
  maskCouponCode,
  resolveOfferImageUrl,
  storeTrustStats,
} from "@/lib/catalog/offer-display";

describe("offer display", () => {
  it("resolves card images offer, then brand, then the global default", () => {
    expect(resolveOfferImageUrl("https://cdn.example/a.png", "https://cdn.example/b.png")).toBe(
      "https://cdn.example/a.png",
    );
    expect(resolveOfferImageUrl("  ", "https://cdn.example/b.png")).toBe(
      "https://cdn.example/b.png",
    );
    expect(resolveOfferImageUrl(null, null)).toBe("/images/default-offer.png");
  });

  it("labels offer channels", () => {
    expect(channelLabel("online")).toBe("Online only");
    expect(channelLabel("in_store")).toBe("In store");
    expect(channelLabel("both")).toBe("Auto at checkout");
    expect(channelLabel(null)).toBeNull();
    expect(channelLabel("nope")).toBeNull();
  });

  it("masks a coupon code until it is revealed", () => {
    expect(maskCouponCode("SAVE20")).toBe("SA••••");
    expect(maskCouponCode("AB")).toBe("••••");
  });

  it("counts active offers, offers added today, and the latest verification", () => {
    const now = new Date("2026-10-06T15:00:00Z");
    const stats = storeTrustStats(
      [
        {
          createdAt: new Date("2026-10-06T01:00:00Z"),
          verifiedAt: new Date("2026-10-01T00:00:00Z"),
        },
        {
          createdAt: new Date("2026-10-05T23:00:00Z"),
          verifiedAt: new Date("2026-10-04T00:00:00Z"),
        },
      ],
      now,
    );
    expect(stats.activeCount).toBe(2);
    expect(stats.addedToday).toBe(1);
    expect(stats.lastVerified?.toISOString()).toBe("2026-10-04T00:00:00.000Z");
  });

  it("keeps a banner live only inside its window", () => {
    const now = new Date("2026-10-06T12:00:00Z");
    expect(
      isBannerLive({ isActive: true, startsAt: null, endsAt: null }, now),
    ).toBe(true);
    expect(
      isBannerLive(
        {
          isActive: true,
          startsAt: new Date("2026-10-07T00:00:00Z"),
          endsAt: null,
        },
        now,
      ),
    ).toBe(false);
    expect(
      isBannerLive({ isActive: false, startsAt: null, endsAt: null }, now),
    ).toBe(false);
  });

  it("builds banner links to an offer click or a store page", () => {
    expect(bannerHref({ linkType: "offer", offerId: "off-1", merchantSlug: null })).toBe(
      "/go/off-1",
    );
    expect(
      bannerHref({ linkType: "store", offerId: null, merchantSlug: "nike" }),
    ).toBe("/store/nike");
    expect(bannerHref({ linkType: "offer", offerId: null, merchantSlug: null })).toBeNull();
  });
});
