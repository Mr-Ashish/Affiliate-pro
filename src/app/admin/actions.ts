"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createMerchant,
  getMerchantSlugById,
} from "@/lib/catalog/merchants";
import { createManualOffer } from "@/lib/catalog/offers";
import { revalidateEditorial, revalidatePublicCatalog } from "@/lib/catalog/public-cache";
import { createPost, updatePost } from "@/lib/editorial/posts";
import type { PostStatus } from "@/lib/editorial/types";
import type { OfferStatus, OfferType } from "@/lib/catalog/types";

const OFFER_TYPES = new Set<OfferType>(["coupon", "deal", "sale"]);
const OFFER_STATUSES = new Set<OfferStatus>([
  "draft",
  "active",
  "expired",
  "disabled",
]);
const POST_STATUSES = new Set<PostStatus>(["draft", "published"]);

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

function optionalText(value: FormDataEntryValue | null): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertHttpUrl(label: string, value: string | null): void {
  if (!value) return;
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    throw new Error(`${label} must start with http:// or https://`);
  }
}

function postFieldsFromForm(formData: FormData) {
  const statusRaw = String(formData.get("status") ?? "").trim();
  if (statusRaw.length > 0 && !POST_STATUSES.has(statusRaw as PostStatus)) {
    throw new Error("status must be draft or published");
  }
  const status: PostStatus =
    statusRaw.length > 0 ? (statusRaw as PostStatus) : "draft";
  const heroImageUrl = optionalText(formData.get("heroImageUrl"));
  assertHttpUrl("heroImageUrl", heroImageUrl);
  return {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    status,
    isFeatured: formData.get("isFeatured") === "on",
    seoTitle: optionalText(formData.get("seoTitle")),
    seoDescription: optionalText(formData.get("seoDescription")),
    heroImageUrl,
    heroImageAlt: optionalText(formData.get("heroImageAlt")),
    merchantIds: formData
      .getAll("merchantIds")
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0),
  };
}

export async function createPostAction(formData: FormData) {
  await requireAdmin();

  let error: string | null = null;
  try {
    const fields = postFieldsFromForm(formData);
    const post = await createPost(fields);
    revalidateEditorial(post.slug);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to create post";
  }

  if (error) {
    redirect(`/admin/posts/new?error=${encodeURIComponent(error)}`);
  }
  redirect("/admin/posts");
}

export async function updatePostAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();

  let error: string | null = null;
  try {
    const fields = postFieldsFromForm(formData);
    const post = await updatePost({ id, ...fields });
    revalidateEditorial(post.slug);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to update post";
  }

  if (error) {
    redirect(
      `/admin/posts/${id}/edit?error=${encodeURIComponent(error)}`,
    );
  }
  redirect("/admin/posts");
}
