import { createHash } from "node:crypto";

export type IdentityInput = {
  market: string;
  merchantExternalKey: string;
  offerType: string;
  code?: string | null;
  title: string;
};

/**
 * Cross-source identity hint (32 hex chars).
 * Same market + merchant + type + code (or normalized title if no code) → same key.
 */
export function buildIdentityKey(input: IdentityInput): string {
  const codePart = (input.code ?? "").trim().toUpperCase();
  const titlePart = input.title.trim().toLowerCase().replace(/\s+/g, " ");
  const basis = [
    input.market.trim(),
    input.merchantExternalKey.trim().toLowerCase(),
    input.offerType.trim().toLowerCase(),
    codePart || titlePart,
  ].join("|");
  return createHash("sha256").update(basis).digest("hex").slice(0, 32);
}
