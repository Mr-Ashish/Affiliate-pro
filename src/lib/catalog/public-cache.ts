import { revalidatePath } from "next/cache";
import { DEFAULT_MARKET, marketPath, SWITCHER_MARKET_CODES } from "@/lib/market/path";

/** ISR window for public catalog HTML (seconds). CDN-friendly; /go stays dynamic. */
export const PUBLIC_PAGE_REVALIDATE_SECONDS = 120;

export function revalidatePublicCatalog(storeSlug?: string, market = DEFAULT_MARKET) {
  revalidatePath(marketPath(market));
  revalidatePath(marketPath(market, "/stores"));
  revalidatePath(marketPath(market, "/deals"));
  revalidatePath(marketPath(market, "/trending"));
  if (storeSlug) {
    revalidatePath(marketPath(market, `/store/${storeSlug}`));
  }
}

export function revalidateEditorial(slug?: string, market = DEFAULT_MARKET) {
  revalidatePath(marketPath(market));
  revalidatePath(marketPath(market, "/blog"));
  if (slug) revalidatePath(marketPath(market, `/blog/${slug}`));
  revalidatePath("/sitemap.xml");
}

export function revalidateCategoryPages(slugs: string[] = []) {
  const unique = [...new Set(slugs.filter(Boolean))];
  for (const market of SWITCHER_MARKET_CODES) {
    revalidatePath(marketPath(market, "/categories"));
    for (const slug of unique) {
      revalidatePath(marketPath(market, `/category/${slug}`));
    }
  }
  revalidatePath("/sitemap.xml");
}
