import { describe, expect, it } from "vitest";
import {
  offerBadges,
  offerCtaLabel,
  statusBadgeTone,
  toDealCardViewModel,
} from "@/lib/ui/view-models";

describe("view-models", () => {
  const now = new Date("2026-07-25T12:00:00Z");
  const merchant = { name: "Nike", slug: "nike", logoUrl: null };

  it("offerCtaLabel picks Get Code when code present", () => {
    expect(offerCtaLabel("SAVE10")).toBe("Get Code");
    expect(offerCtaLabel(null)).toBe("Shop Deal");
    expect(offerCtaLabel("")).toBe("Shop Deal");
  });

  it("offerBadges includes featured exclusive ending-soon", () => {
    const badges = offerBadges(
      {
        id: "1",
        title: "t",
        offerType: "coupon",
        status: "active",
        isFeatured: true,
        isExclusive: true,
        endsAt: new Date("2026-07-28T12:00:00Z"),
      },
      now,
    );
    expect(badges.map((b) => b.label)).toEqual([
      "Featured",
      "Exclusive",
      "Ending Soon",
    ]);
  });

  it("toDealCardViewModel maps go href and merchant", () => {
    const vm = toDealCardViewModel(
      {
        id: "abc",
        title: "20% off",
        description: "desc",
        code: "NIKE20",
        offerType: "coupon",
        status: "active",
      },
      merchant,
      now,
    );
    expect(vm.goHref).toBe("/go/abc");
    expect(vm.ctaLabel).toBe("Get Code");
    expect(vm.merchantName).toBe("Nike");
    expect(vm.merchantSlug).toBe("nike");
  });

  it("statusBadgeTone maps known statuses", () => {
    expect(statusBadgeTone("active")).toBe("active");
    expect(statusBadgeTone("expired")).toBe("expired");
    expect(statusBadgeTone("draft")).toBe("draft");
    expect(statusBadgeTone("disabled")).toBe("neutral");
  });
});
