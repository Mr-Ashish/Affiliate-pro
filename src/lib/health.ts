import { prisma } from "@/lib/db";

export type HealthStatus = {
  ok: boolean;
  db: "up" | "down";
};

export async function getHealthStatus(): Promise<HealthStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, db: "up" };
  } catch {
    return { ok: false, db: "down" };
  }
}
