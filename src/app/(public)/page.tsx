import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { DealCard } from "@/components/public/DealCard";
import { HeroSearch } from "@/components/public/HeroSearch";
import { OfferRow } from "@/components/public/OfferRow";
import { PopularStores } from "@/components/public/PopularStores";
import { listPopularMerchants } from "@/lib/catalog/merchants";
import {
  listFeaturedOffers,
  listRecentOffers,
} from "@/lib/catalog/offers";
import {
  toDealCardViewModel,
  toOfferRowViewModel,
} from "@/lib/ui/view-models";
const MARKET = "US";

/** Must be a numeric literal for Next.js (see PUBLIC_PAGE_REVALIDATE_SECONDS). */
export const revalidate = 120;

export default async function HomePage() {
  const [featured, recent, popular] = await Promise.all([
    listFeaturedOffers({ market: MARKET, limit: 6 }),
    listRecentOffers({ market: MARKET, limit: 8 }),
    listPopularMerchants({ market: MARKET, limit: 12 }),
  ]);

  const featuredCards = featured.map((o) =>
    toDealCardViewModel(o, o.merchant),
  );
  const recentRows = recent.map((o) => toOfferRowViewModel(o, o.merchant));

  return (
    <main>
      <Container className="space-y-16 py-10 md:py-14">
        <HeroSearch />

        <section aria-labelledby="featured-heading">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2
              id="featured-heading"
              className="text-2xl font-bold text-on-surface"
            >
              Featured Deals
            </h2>
            <Link
              href="/stores"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View all stores
            </Link>
          </div>
          {featuredCards.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              No featured deals yet. Browse stores for the latest offers.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCards.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="popular-heading">
          <h2
            id="popular-heading"
            className="mb-6 text-2xl font-bold text-on-surface"
          >
            Popular Stores
          </h2>
          <PopularStores
            stores={popular.map((m) => ({
              name: m.name,
              slug: m.slug,
              logoUrl: m.logoUrl,
              offerCount: m.offerCount,
            }))}
          />
        </section>

        <section aria-labelledby="recent-heading">
          <h2
            id="recent-heading"
            className="mb-2 text-2xl font-bold text-on-surface"
          >
            Recent Offers
          </h2>
          {recentRows.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              No recent offers yet.
            </p>
          ) : (
            <ul className="rounded-lg border border-outline-variant/60 bg-surface-lowest px-5">
              {recentRows.map((offer) => (
                <OfferRow key={offer.id} offer={offer} />
              ))}
            </ul>
          )}
        </section>
      </Container>
    </main>
  );
}
