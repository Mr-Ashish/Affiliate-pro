import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type OutboundRedirect = {
  url: string;
};

export type RecordOutboundClickInput = {
  offerId: string;
  referrer?: string | null;
  uaHash?: string | null;
  ipHash?: string | null;
  meta?: Prisma.InputJsonValue | null;
};

/**
 * Resolve a tracked outbound redirect for an offer.
 * Returns { url } only when offer is active, within date window, and merchant is active.
 * URL is always the offer's stored affiliateUrl (never open-redirect).
 */
export async function resolveOutboundRedirect(
  offerId: string,
  options?: { now?: Date },
): Promise<OutboundRedirect | null> {
  const id = offerId.trim();
  if (!id) return null;

  const now = options?.now ?? new Date();

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      merchant: { select: { isActive: true } },
    },
  });

  if (!offer) return null;
  if (!offer.merchant.isActive) return null;
  if (offer.status !== "active") return null;

  if (offer.startsAt && offer.startsAt > now) return null;
  if (offer.endsAt && offer.endsAt <= now) return null;

  const url = offer.affiliateUrl.trim();
  if (!url) return null;

  return { url };
}

/**
 * Persist a click event and increment offer.clickCount.
 * Call only after resolveOutboundRedirect succeeds.
 */
export async function recordOutboundClick(
  input: RecordOutboundClickInput,
): Promise<void> {
  const offerId = input.offerId.trim();
  if (!offerId) {
    throw new Error("offerId is required");
  }

  await prisma.$transaction([
    prisma.clickEvent.create({
      data: {
        offerId,
        referrer: input.referrer ?? null,
        uaHash: input.uaHash ?? null,
        ipHash: input.ipHash ?? null,
        meta: input.meta ?? undefined,
      },
    }),
    prisma.offer.update({
      where: { id: offerId },
      data: { clickCount: { increment: 1 } },
    }),
  ]);
}
