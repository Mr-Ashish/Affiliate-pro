import { describe, expect, it } from "vitest";
import {
  DEFAULT_MARKET,
  SWITCHER_MARKET_CODES,
  marketPath,
  parseMarketParam,
  redirectUnprefixedPublicPath,
  swapMarketPath,
} from "@/lib/market/path";
import { marketFromCurrency } from "@/lib/market/currency";

describe("market path helpers", () => {
  it("defaults to US", () => {
    expect(DEFAULT_MARKET).toBe("US");
    expect(marketPath("US")).toBe("/us");
    expect(marketPath("GB", "/store/ottocast")).toBe("/gb/store/ottocast");
  });

  it("parses a two-letter market segment", () => {
    expect(parseMarketParam("us")).toBe("US");
    expect(parseMarketParam("GB")).toBe("GB");
    expect(parseMarketParam("eu")).toBe("EU");
    expect(parseMarketParam("stores")).toBeNull();
    expect(parseMarketParam("")).toBeNull();
  });

  it("redirects unprefixed catalog paths to /us", () => {
    expect(redirectUnprefixedPublicPath("/")).toBe("/us");
    expect(redirectUnprefixedPublicPath("/store/ottocast")).toBe(
      "/us/store/ottocast",
    );
    expect(redirectUnprefixedPublicPath("/deals")).toBe("/us/deals");
    expect(redirectUnprefixedPublicPath("/us")).toBeNull();
    expect(redirectUnprefixedPublicPath("/us/store/ottocast")).toBeNull();
    expect(redirectUnprefixedPublicPath("/admin/login")).toBeNull();
    expect(redirectUnprefixedPublicPath("/go/abc")).toBeNull();
    expect(redirectUnprefixedPublicPath("/api/health")).toBeNull();
  });

  it("swaps the market segment and keeps the rest of the path", () => {
    expect(swapMarketPath("/us/store/ottocast", "GB")).toBe(
      "/gb/store/ottocast",
    );
    expect(swapMarketPath("/us", "EU")).toBe("/eu");
    expect(swapMarketPath("/gb/deals", "US")).toBe("/us/deals");
  });

  it("lists US, GB, and EU on the switcher", () => {
    expect(SWITCHER_MARKET_CODES).toEqual(["US", "GB", "EU"]);
  });
});

describe("marketFromCurrency", () => {
  it("maps network currencies to catalog markets", () => {
    expect(marketFromCurrency("USD")).toBe("US");
    expect(marketFromCurrency("GBP")).toBe("GB");
    expect(marketFromCurrency("EUR")).toBe("EU");
    expect(marketFromCurrency("cad")).toBe("CA");
    expect(marketFromCurrency("XXX")).toBeNull();
  });
});
