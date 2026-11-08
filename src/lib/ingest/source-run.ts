import { prisma } from "@/lib/db";
import type { SourceId } from "@/lib/ingest/types";

export async function startSourceRun(input: { sourceId: SourceId; jobName: string }) {
  return prisma.sourceRun.create({
    data: {
      sourceId: input.sourceId,
      jobName: input.jobName,
      status: "running",
    },
  });
}

export async function finishSourceRun(
  id: string,
  data: {
    status: string;
    stats?: unknown;
    error?: string | null;
  },
) {
  await prisma.sourceRun.update({
    where: { id },
    data: {
      status: data.status,
      stats: data.stats === undefined ? undefined : (data.stats as object),
      error: data.error ?? null,
      finishedAt: new Date(),
    },
  });
}
