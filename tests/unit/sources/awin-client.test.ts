import { describe, expect, it, vi } from "vitest";
import {
  AwinClient,
  isLastPromotionPage,
} from "@/lib/sources/awin/client";

describe("isLastPromotionPage", () => {
  it("uses total when present", () => {
    expect(isLastPromotionPage(1, 10, 10, 14)).toBe(false);
    expect(isLastPromotionPage(2, 10, 4, 14)).toBe(true);
  });

  it("falls back to short page when total is missing", () => {
    expect(isLastPromotionPage(1, 10, 10)).toBe(false);
    expect(isLastPromotionPage(2, 10, 4)).toBe(true);
  });
});

describe("AwinClient", () => {
  it("lists joined programmes and paginates promotions with a gap between calls", async () => {
    const sleep = vi.fn(async () => undefined);
    const nowValues = [0, 100, 100, 4000];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/programmes")) {
        return new Response(
          JSON.stringify([
            {
              id: 111,
              name: "Nike US",
              displayUrl: "https://www.nike.com",
              logoUrl: "https://cdn.example.com/nike.png",
              primaryRegion: { countryCode: "US", name: "United States" },
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        pagination?: { page?: number };
      };
      const page = body.pagination?.page ?? 1;
      return new Response(
        JSON.stringify({
          data: [
            {
              promotionId: page === 1 ? 1 : 2,
              type: "promotion",
              title: page === 1 ? "first" : "second",
              advertiser: { id: 111, name: "Nike US", joined: true },
              urlTracking: "https://www.awin1.com/cread.php?awinmid=111",
            },
          ],
          pagination: { page, pageSize: 1, total: 2 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const client = new AwinClient({
      token: "test-token",
      publisherId: "3073001",
      fetchImpl,
      sleep,
      now: () => nowValues.shift() ?? 4000,
      minIntervalMs: 3000,
      pageSize: 1,
    });

    const programmes = await client.listJoinedProgrammes();
    expect(programmes[0]?.id).toBe(111);
    expect(programmes[0]?.primaryRegion?.countryCode).toBe("US");

    const page = await client.listAllPromotions();
    expect(page.incomplete).toBe(false);
    expect(page.promotions.map((row) => row.promotionId)).toEqual([1, 2]);

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalled();
    const programmeUrl = String(fetchImpl.mock.calls[0]?.[0]);
    expect(programmeUrl).toContain("/publishers/3073001/programmes");
    expect(programmeUrl).toContain("relationship=joined");
    const promoUrl = String(fetchImpl.mock.calls[1]?.[0]);
    expect(promoUrl).toContain("/publisher/3073001/promotions");
  });

  it("marks the pull incomplete when max pages is hit", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          data: [
            {
              promotionId: 1,
              type: "promotion",
              title: "x",
              advertiser: { id: 1, name: "A", joined: true },
            },
          ],
          pagination: { page: 1, pageSize: 1, total: 9 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    const client = new AwinClient({
      token: "test-token",
      publisherId: "1",
      fetchImpl,
      sleep: async () => undefined,
      now: () => 0,
      minIntervalMs: 0,
      pageSize: 1,
      maxPages: 1,
    });
    const result = await client.listAllPromotions();
    expect(result.incomplete).toBe(true);
    expect(result.promotions).toHaveLength(1);
  });
});
