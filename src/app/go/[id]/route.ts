import { NextRequest, NextResponse } from "next/server";
import {
  recordOutboundClick,
  resolveOutboundRedirect,
} from "@/lib/catalog/go";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /go/[id] — tracked affiliate outbound.
 * Money path: log click_events, increment click_count, 302 to DB affiliateUrl only.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const resolved = await resolveOutboundRedirect(id);

  if (!resolved) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const src = request.nextUrl.searchParams.get("src");
  const meta = src ? { src } : null;

  await recordOutboundClick({
    offerId: id,
    referrer: request.headers.get("referer"),
    meta,
  });

  const response = NextResponse.redirect(resolved.url, 302);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
