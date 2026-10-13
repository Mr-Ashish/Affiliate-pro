import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BannerCarousel, type BannerSlide } from "@/components/public/BannerCarousel";
import { DealCard } from "@/components/public/DealCard";
import {
  ExclusiveCodesList,
  type ListOffer,
} from "@/components/public/ExclusiveCodesList";
import { MaterialIcon } from "@/components/public/MaterialIcon";
import { SavingsTipsSection } from "@/components/public/SavingsTipsSection";
import { TrendingDealsList } from "@/components/public/TrendingDealsList";
import { listActiveBanners } from "@/lib/catalog/banners";
import { bannerHref } from "@/lib/catalog/offer-display";
import {
  listExclusiveOffers,
  listFeaturedOffers,
  listTrendingOffers,
} from "@/lib/catalog/offers";
import { catalogOrEmpty } from "@/lib/db-prerender";
import { listPublishedPosts } from "@/lib/editorial/posts";
import { toDealCardViewModel } from "@/lib/ui/view-models";

const MARKET = "US";
export const revalidate = 120;

const FEATURED_SUBTITLE =
  "Top-performing coupon codes tested and approved by our shopping editors today.";

function mapBannersToSlides(
  banners: Awaited<ReturnType<typeof listActiveBanners>>,
): BannerSlide[] {
  return banners.map((banner) => {
    const href = bannerHref({
      linkType: banner.linkType as "offer" | "store",
      offerId: banner.offerId,
      merchantSlug: banner.merchant?.slug ?? null,
    });
    const goHref =
      banner.linkType === "offer" && banner.offer ? `/go/${banner.offer.id}` : null;
    return {
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      imageUrl: banner.imageUrl,
      ctaLabel: banner.ctaLabel,
      isSponsored: banner.isSponsored,
      isExclusive: banner.offer?.isExclusive ?? false,
      href: goHref ? null : href,
      code: banner.offer?.code ?? null,
      goHref,
    };
  });
}

type OfferWithMerchant = Awaited<ReturnType<typeof listExclusiveOffers>>[number];

function mapOfferToListOffer(offer: OfferWithMerchant): ListOffer {
  const vm = toDealCardViewModel(offer, offer.merchant);
  return {
    id: offer.id,
    title: offer.title,
    code: offer.code ?? null,
    goHref: `/go/${offer.id}`,
    discountLabel: vm.discountLabel,
    verifiedAt: vm.verifiedAt,
    merchantName: offer.merchant.name,
    merchantLogoUrl: offer.merchant.logoUrl ?? null,
  };
}

export default async function HomePage() {
  const [featured, exclusive, trending, posts, banners] = await Promise.all([
    catalogOrEmpty(() => listFeaturedOffers({ market: MARKET, limit: 3 }), []),
    catalogOrEmpty(() => listExclusiveOffers({ market: MARKET, limit: 5 }), []),
    catalogOrEmpty(() => listTrendingOffers({ market: MARKET, limit: 5 }), []),
    catalogOrEmpty(() => listPublishedPosts({ limit: 4 }), []),
    catalogOrEmpty(() => listActiveBanners({ market: MARKET }), []),
  ]);

  const featuredCards = featured.map((offer) => toDealCardViewModel(offer, offer.merchant));
  const exclusiveList = exclusive.map(mapOfferToListOffer);
  const trendingList = trending.map(mapOfferToListOffer);
  const bannerSlides = mapBannersToSlides(banners);

  return (
    <main>
      <Container className="space-y-10 py-10 md:py-14">
        <BannerCarousel slides={bannerSlides} />

        {featuredCards.length > 0 ? (
          <section aria-labelledby="featured-heading">
            <div className="mb-4 flex flex-col gap-2 border-b border-[#E2E8F0] pb-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <MaterialIcon name="verified" filled size={26} className="text-[#059669]" />
                  <h2
                    id="featured-heading"
                    className="font-display text-xl font-bold text-[#0F172A] md:text-2xl"
                  >
                    Top Verified Coupons &amp; Promo Codes
                  </h2>
                </div>
                <p className="mt-0.5 text-sm text-[#64748B]">{FEATURED_SUBTITLE}</p>
              </div>
              <Link
                href="/deals"
                className="inline-flex items-center gap-1 self-start text-[13px] font-bold text-[#047857] hover:text-[#065F46] hover:underline sm:self-auto"
              >
                View all
                <MaterialIcon name="arrow_forward" size={16} />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCards.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <ExclusiveCodesList offers={exclusiveList} />
          <TrendingDealsList offers={trendingList} />
        </div>

        <SavingsTipsSection posts={posts} />
      </Container>
    </main>
  );
}
