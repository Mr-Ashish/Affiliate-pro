import { describe, expect, it, vi } from "vitest";
import {
  TradeDoublerClient,
  isLastVoucherPage,
} from "@/lib/sources/tradedoubler/client";

describe("isLastVoucherPage", () => {
  it("treats a short page as the last page", () => {
    expect(isLastVoucherPage(100, 100)).toBe(false);
    expect(isLastVoucherPage(4, 100)).toBe(true);
  });
});

describe("TradeDoublerClient", () => {
  it("paginates vouchers and keeps the token out of thrown errors", async () => {
    const sleep = vi.fn(async () => undefined);
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      expect(url.searchParams.get("token")).toBe("site-token");
      const page = /page=(\d+)/.exec(url.pathname)?.[1] ?? "0";
      if (page === "0") {
        return new Response(
          JSON.stringify([
            {
              id: 1,
              programId: 9,
              programName: "Shop",
              voucherTypeId: 1,
              title: "first",
              defaultTrackUri: "https://clk.tradedoubler.com/click?p=9",
              landingUrl: "https://www.example.com/",
              currencyId: "USD",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const client = new TradeDoublerClient({
      token: "site-token",
      fetchImpl,
      sleep,
      pageSize: 1,
      minIntervalMs: 50,
      now: () => 0,
    });
    const pulled = await client.listAllVouchers();
    expect(pulled.incomplete).toBe(false);
    expect(pulled.vouchers.map((row) => row.id)).toEqual([1]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalled();
  });
});
