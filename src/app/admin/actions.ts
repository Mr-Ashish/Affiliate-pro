"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createMerchant,
  getMerchantSlugById,
} from "@/lib/catalog/merchants";
import { createManualOffer } from "@/lib/catalog/offers";
import { revalidatePublicCatalog } from "@/lib/catalog/public-cache";
import type { OfferStatus, OfferType } from "@/lib/catalog/types";

const OFFER_TYPES = new Set<OfferType>(["coupon", "deal", "sale"]);
const OFFER_STATUSES = new Set<OfferStatus>([
  "draft",
  "active",
  "expired",
  "disabled",
]);

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createMerchantAction(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const siteUrl = String(formData.get("siteUrl") ?? "").trim();
  const market = String(formData.get("market") ?? "US").trim() || "US";

  let error: string | null = null;
  try {
    await createMerchant({ market, slug, name, siteUrl });
    revalidatePublicCatalog(slug);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to create merchant";
  }

  if (error) {
    redirect(
      `/admin/merchants/new?error=${encodeURIComponent(error)}`,
    );
  }
  redirect("/admin/merchants");
}

export async function createOfferAction(formData: FormData) {
  await requireAdmin();

  const merchantId = String(formData.get("merchantId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const offerTypeRaw = String(formData.get("offerType") ?? "coupon").trim();
  const codeRaw = String(formData.get("code") ?? "").trim();
  const affiliateUrl = String(formData.get("affiliateUrl") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "active").trim();

  if (!OFFER_TYPES.has(offerTypeRaw as OfferType)) {
    redirect(
      `/admin/offers/new?error=${encodeURIComponent("offerType must be coupon, deal, or sale")}`,
    );
  }
  if (!OFFER_STATUSES.has(statusRaw as OfferStatus)) {
    redirect(
      `/admin/offers/new?error=${encodeURIComponent("invalid status")}`,
    );
  }

  const offerType = offerTypeRaw as OfferType;
  const status = statusRaw as OfferStatus;
  const code = codeRaw.length > 0 ? codeRaw : null;

  let error: string | null = null;
  try {
    await createManualOffer({
      merchantId,
      title,
      offerType,
      code,
      affiliateUrl,
      status,
    });
    const slug = await getMerchantSlugById(merchantId);
    revalidatePublicCatalog(slug ?? undefined);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to create offer";
  }

  if (error) {
    redirect(`/admin/offers/new?error=${encodeURIComponent(error)}`);
  }
  redirect("/admin/offers");
}
