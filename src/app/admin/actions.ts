"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createMerchant,
  getMerchantSlugById,
} from "@/lib/catalog/merchants";
import { createBanner } from "@/lib/catalog/banners";
import { createManualOffer, updateOfferStatus } from "@/lib/catalog/offers";
import { revalidateEditorial, revalidatePublicCatalog } from "@/lib/catalog/public-cache";
import { createPost, updatePost } from "@/lib/editorial/posts";
import type { PostStatus } from "@/lib/editorial/types";
import type { OfferChannel, OfferStatus, OfferType } from "@/lib/catalog/types";

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
  const logoUrl = optionalText(formData.get("logoUrl"));
  const description = optionalText(formData.get("description"));
  const defaultOfferImageUrl = optionalText(formData.get("defaultOfferImageUrl"));

  let error: string | null = null;
  try {
    assertHttpUrl("logoUrl", logoUrl);
    assertHttpUrl("defaultOfferImageUrl", defaultOfferImageUrl);
    await createMerchant({
      market,
      slug,
      name,
      siteUrl,
      logoUrl,
      description,
      defaultOfferImageUrl,
    });
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
    const channelRaw = optionalText(formData.get("channel"));
    const channels = new Set<OfferChannel>(["online", "in_store", "both"]);
    if (channelRaw && !channels.has(channelRaw as OfferChannel)) {
      throw new Error("channel must be online, in_store, or both");
    }
    const imageUrl = optionalText(formData.get("imageUrl"));
    assertHttpUrl("imageUrl", imageUrl);
    await createManualOffer({
      merchantId,
      title,
      description: optionalText(formData.get("description")),
      offerType,
      code,
      affiliateUrl,
      status,
      startsAt: optionalDate(formData.get("startsAt")),
      endsAt: optionalDate(formData.get("endsAt")),
      isFeatured: formData.get("isFeatured") === "on",
      terms: optionalText(formData.get("terms")),
      isExclusive: formData.get("isExclusive") === "on",
      discountLabel: optionalText(formData.get("discountLabel")),
      imageUrl,
      channel: (channelRaw as OfferChannel | null) ?? null,
      verifiedAt: optionalDate(formData.get("verifiedAt")),
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

export async function updateOfferStatusAction(formData: FormData) {
  await requireAdmin();

  const offerId = String(formData.get("offerId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  let error: string | null = null;
  try {
    const updated = await updateOfferStatus(offerId, status);
    const slug = await getMerchantSlugById(updated.merchantId);
    revalidatePublicCatalog(slug ?? undefined);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to update offer";
  }

  if (error) {
    redirect(`/admin/offers?error=${encodeURIComponent(error)}`);
  }
  redirect("/admin/offers");
}

function optionalDate(value: FormDataEntryValue | null): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error("invalid date");
  }
  return date;
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
    category: optionalText(formData.get("category")),
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

export async function createBannerAction(formData: FormData) {
  await requireAdmin();
  let error: string | null = null;
  try {
    const linkType = String(formData.get("linkType") ?? "store").trim();
    if (linkType !== "offer" && linkType !== "store") {
      throw new Error("linkType must be offer or store");
    }
    const imageUrl = String(formData.get("imageUrl") ?? "").trim();
    assertHttpUrl("imageUrl", imageUrl);
    const sortRaw = String(formData.get("sortOrder") ?? "0").trim();
    const sortOrder = Number(sortRaw);
    if (!Number.isFinite(sortOrder)) throw new Error("sortOrder must be a number");
    await createBanner({
      market: String(formData.get("market") ?? "US").trim() || "US",
      title: String(formData.get("title") ?? ""),
      subtitle: optionalText(formData.get("subtitle")),
      imageUrl,
      ctaLabel: String(formData.get("ctaLabel") ?? ""),
      linkType,
      offerId: optionalText(formData.get("offerId")),
      merchantId: optionalText(formData.get("merchantId")),
      sortOrder,
      startsAt: optionalDate(formData.get("startsAt")),
      endsAt: optionalDate(formData.get("endsAt")),
      isActive: formData.get("isActive") === "on",
      isSponsored: formData.get("isSponsored") === "on",
    });
    revalidatePublicCatalog();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to create banner";
  }
  if (error) {
    redirect(`/admin/banners/new?error=${encodeURIComponent(error)}`);
  }
  redirect("/admin/banners");
}
