import { cache } from "react";
import { getMerchantBySlug } from "@/lib/catalog/merchants";
import { listActiveOffersForMerchantId } from "@/lib/catalog/offers";
import type { Merchant, Offer } from "@prisma/client";

export type StorePageData = {
  merchant: Merchant;
  offers: Offer[];
};

async function loadStorePageData(
  market: string,
  slug: string,
  nowMs?: number,
): Promise<StorePageData | null> {
  const merchant = await getMerchantBySlug({ market, slug });

  if (!merchant || !merchant.isActive) {
    return null;
  }

  const offers = await listActiveOffersForMerchantId({
    merchantId: merchant.id,
    market,
    now: nowMs != null ? new Date(nowMs) : undefined,
  });

  return { merchant, offers };
}

const getStorePageDataCached = cache(loadStorePageData);

/**
 * Load public store page data for an active merchant.
 * Request-deduped via React.cache so generateMetadata + page share one load.
 * Returns null when merchant is missing or inactive (caller should 404).
 */
export function getStorePageData(params: {
  market: string;
  slug: string;
  now?: Date;
}): Promise<StorePageData | null> {
  return getStorePageDataCached(
    params.market,
    params.slug,
    params.now?.getTime(),
  );
}

export function storePageTitle(merchantName: string): string {
  return `${merchantName} Coupons & Promo Codes`;
}
