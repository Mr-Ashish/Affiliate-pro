import { describe, expect, it, vi } from "vitest";
import { ingestMappedResults } from "@/lib/ingest/run-mapped";
import type { MapResult } from "@/lib/ingest/types";

const okOffer = {
  sourceId: "awin" as const,
  sourceRecordId: "1001:US",
  market: "US",
  merchantExternalId: "111",
  merchantName: "Nike US",
  merchantSiteUrl: "https://www.nike.com",
  title: "10% off",
  offerType: "deal" as const,
  code: null,
  affiliateUrl: "https://www.awin1.com/cread.php?awinmid=111",
  status: "active" as const,
  rawPayload: { promotionId: 1001 },
};

function ok(): MapResult {
  return { ok: true, offer: okOffer };
}

describe("ingestMappedResults", () => {
  it("upserts mapped offers, records skips, and expires unseen only when the run is complete", async () => {
    const pushOffer = vi.fn(async (input: { sourceRecordId: string }) => ({
      id: `offer-${input.sourceRecordId}`,
      sourceRecordId: input.sourceRecordId,
    }));
    const expireUnseen = vi.fn(async () => 2);
    const startRun = vi.fn(async () => ({ id: "run-1" }));
    const finishRun = vi.fn(async () => undefined);

    const stats = await ingestMappedResults(
      {
        sourceId: "awin",
        jobName: "awin-promotions",
        incomplete: false,
        results: [ok(), { ok: false, reason: "unknown_market" }],
      },
      { pushOffer, expireUnseen, startRun, finishRun },
    );

    expect(pushOffer).toHaveBeenCalledTimes(1);
    expect(expireUnseen).toHaveBeenCalledWith({
      sourceId: "awin",
      seenRecordIds: ["1001:US"],
    });
    expect(stats.status).toBe("ok");
    expect(stats.upserted).toBe(1);
    expect(stats.skipped.unknown_market).toBe(1);
    expect(stats.expired).toBe(2);
    expect(finishRun).toHaveBeenCalledWith(
      "run-1",
      expect.objectContaining({ status: "ok" }),
    );
  });

  it("does not expire unseen offers when pagination is incomplete", async () => {
    const expireUnseen = vi.fn(async () => 0);
    const finishRun = vi.fn(async () => undefined);
    const stats = await ingestMappedResults(
      {
        sourceId: "awin",
        jobName: "awin-promotions",
        incomplete: true,
        results: [ok()],
      },
      {
        pushOffer: vi.fn(async () => ({ id: "o", sourceRecordId: "1001" })),
        expireUnseen,
        startRun: async () => ({ id: "run-2" }),
        finishRun,
      },
    );
    expect(expireUnseen).not.toHaveBeenCalled();
    expect(stats.status).toBe("error");
    expect(finishRun).toHaveBeenCalledWith(
      "run-2",
      expect.objectContaining({ status: "error" }),
    );
  });

  it("does not expire when an upsert fails", async () => {
    const expireUnseen = vi.fn(async () => 0);
    const stats = await ingestMappedResults(
      {
        sourceId: "awin",
        jobName: "awin-promotions",
        incomplete: false,
        results: [ok()],
      },
      {
        pushOffer: async () => {
          throw new Error("db down");
        },
        expireUnseen,
        startRun: async () => ({ id: "run-3" }),
        finishRun: async () => undefined,
      },
    );
    expect(expireUnseen).not.toHaveBeenCalled();
    expect(stats.status).toBe("error");
    expect(stats.errors).toBe(1);
  });
});
