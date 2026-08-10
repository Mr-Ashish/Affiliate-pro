import { describe, expect, it } from "vitest";
import { storePageTitle } from "@/lib/catalog/store-page";

describe("storePageTitle", () => {
  it("formats SEO title as '{Name} Coupons & Promo Codes'", () => {
    expect(storePageTitle("Nike")).toBe("Nike Coupons & Promo Codes");
    expect(storePageTitle("Amazon")).toBe("Amazon Coupons & Promo Codes");
  });
});
