import { describe, expect, it } from "vitest";
import { slugifyMerchantName } from "@/lib/ingest/slug";

describe("slugifyMerchantName", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyMerchantName("Angara UK")).toBe("angara-uk");
  });

  it("falls back when the name has no letters", () => {
    expect(slugifyMerchantName("***")).toBe("merchant");
  });
});
