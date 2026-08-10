import { NextResponse } from "next/server";
import { getHealthStatus } from "@/lib/health";

export const dynamic = "force-dynamic";

/**
 * Liveness/readiness for ALB, App Runner, Lightsail, and local monitors.
 * Does not cache; never leaks connection strings.
 */
export async function GET() {
  const status = await getHealthStatus();
  return NextResponse.json(status, {
    status: status.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
