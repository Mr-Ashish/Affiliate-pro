import { expireUnseenOffers, pushNormalizedOffer } from "@/lib/ingest/push-offer";
import { finishSourceRun, startSourceRun } from "@/lib/ingest/source-run";
import type { MapResult, SourceId } from "@/lib/ingest/types";

export type IngestRunStatus = "ok" | "error";

export type IngestStats = {
  status: IngestRunStatus;
  fetched: number;
  upserted: number;
  skipped: Record<string, number>;
  expired: number;
  errors: number;
  error?: string | null;
};

export type IngestDeps = {
  pushOffer: (input: Extract<MapResult, { ok: true }>["offer"]) => Promise<{
    id: string;
    sourceRecordId: string;
  }>;
  expireUnseen: (params: {
    sourceId: SourceId;
    seenRecordIds: string[];
  }) => Promise<number>;
  startRun: (input: { sourceId: SourceId; jobName: string }) => Promise<{ id: string }>;
  finishRun: (
    id: string,
    data: { status: string; stats?: unknown; error?: string | null },
  ) => Promise<void>;
};

const defaultDeps: IngestDeps = {
  pushOffer: pushNormalizedOffer,
  expireUnseen: expireUnseenOffers,
  startRun: startSourceRun,
  finishRun: finishSourceRun,
};

export async function ingestMappedResults(
  input: {
    sourceId: SourceId;
    jobName: string;
    incomplete: boolean;
    results: MapResult[];
  },
  deps: IngestDeps = defaultDeps,
): Promise<IngestStats> {
  const run = await deps.startRun({
    sourceId: input.sourceId,
    jobName: input.jobName,
  });

  const skipped: Record<string, number> = {};
  const seenRecordIds: string[] = [];
  let upserted = 0;
  let errors = 0;
  let firstError: string | null = null;

  for (const result of input.results) {
    if (!result.ok) {
      skipped[result.reason] = (skipped[result.reason] ?? 0) + 1;
      continue;
    }
    try {
      await deps.pushOffer(result.offer);
      seenRecordIds.push(result.offer.sourceRecordId);
      upserted += 1;
    } catch (error) {
      errors += 1;
      if (!firstError) {
        firstError = error instanceof Error ? error.message : String(error);
      }
    }
  }

  const status: IngestRunStatus = input.incomplete || errors > 0 ? "error" : "ok";
  let expired = 0;
  if (status === "ok") {
    expired = await deps.expireUnseen({
      sourceId: input.sourceId,
      seenRecordIds,
    });
  }

  const stats: IngestStats = {
    status,
    fetched: input.results.length,
    upserted,
    skipped,
    expired,
    errors,
    error: input.incomplete ? "pagination incomplete" : firstError,
  };

  await deps.finishRun(run.id, {
    status,
    stats,
    error: stats.error,
  });

  return stats;
}
