import { Container } from "@/components/ui/Container";
import { DealCard } from "@/components/public/DealCard";
import { MaterialIcon } from "@/components/public/MaterialIcon";
import { listTrendingOffers } from "@/lib/catalog/offers";
import { catalogOrEmpty } from "@/lib/db-prerender";
import { toDealCardViewModel } from "@/lib/ui/view-models";

const MARKET = "US";
export const revalidate = 120;
export const metadata = { title: "Trending" };

export default async function TrendingPage() {
  const offers = await catalogOrEmpty(() => listTrendingOffers({ market: MARKET, limit: 24 }), []);
  const cards = offers.map((offer) => toDealCardViewModel(offer, offer.merchant));
  return (
    <main>
      <Container className="space-y-10 py-10">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-on-surface md:text-4xl">
            <MaterialIcon name="local_fire_department" filled size={36} className="text-[var(--urgency)]" />
            Trending
          </h1>
          <p className="mt-2 text-on-surface-variant">The most-clicked deals right now.</p>
        </div>
        {cards.length === 0 ? (
          <p className="text-on-surface-variant">No trending offers yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((deal) => <DealCard key={deal.id} deal={deal} />)}
          </div>
        )}
      </Container>
    </main>
  );
}
