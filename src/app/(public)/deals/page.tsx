import { DealsBrowser } from "@/components/public/DealsBrowser";
import { listPopularMerchants } from "@/lib/catalog/merchants";
import { listRecentOffers } from "@/lib/catalog/offers";
import { catalogOrEmpty } from "@/lib/db-prerender";
import { toDealCardViewModel } from "@/lib/ui/view-models";

const MARKET = "US";
export const revalidate = 120;
export const metadata = { title: "Deals" };

export default async function DealsPage() {
  const [offers, shops] = await Promise.all([
    catalogOrEmpty(() => listRecentOffers({ market: MARKET, limit: 100 }), []),
    catalogOrEmpty(() => listPopularMerchants({ market: MARKET, limit: 12 }), []),
  ]);
  const deals = offers.map((offer) => {
    const card = toDealCardViewModel(offer, offer.merchant);
    const endsAt = offer.endsAt ? new Date(offer.endsAt) : null;
    return {
      id: card.id,
      title: card.title,
      description: card.description,
      merchantName: card.merchantName,
      merchantSlug: card.merchantSlug,
      merchantLogoUrl: card.merchantLogoUrl,
      imageUrl: card.imageUrl,
      code: card.code,
      goHref: card.goHref,
      ctaLabel: card.ctaLabel,
      discountLabel: card.discountLabel,
      badges: card.badges,
      terms: card.terms,
      endsAt: endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt.toISOString() : null,
    };
  });
  return (
    <main>
      <DealsBrowser
        deals={deals}
        shops={shops.map((shop) => ({ name: shop.name, slug: shop.slug, offerCount: shop.offerCount }))}
      />
    </main>
  );
}
