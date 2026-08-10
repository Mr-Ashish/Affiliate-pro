import { revalidatePath } from "next/cache";

/** ISR window for public catalog HTML (seconds). CDN-friendly; /go stays dynamic. */
export const PUBLIC_PAGE_REVALIDATE_SECONDS = 120;

export function revalidatePublicCatalog(storeSlug?: string) {
  revalidatePath("/");
  revalidatePath("/stores");
  if (storeSlug) {
    revalidatePath(`/store/${storeSlug}`);
  }
}
