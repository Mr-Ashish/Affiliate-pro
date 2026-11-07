import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { MerchantHero } from "@/components/public/MerchantHero";
import { StoreOfferBoard, type StoreOfferItem } from "@/components/public/StoreOfferBoard";
import { getStorePageData, storePageTitle } from "@/lib/catalog/store-page";
import { channelLabel, storeTrustStats } from "@/lib/catalog/offer-display";
import { offerBadges, offerCtaLabel } from "@/lib/ui/view-models";
import { listActiveMerchants } from "@/lib/catalog/merchants";
import { catalogOrEmpty } from "@/lib/db-prerender";
import { listPublishedPostsForMerchant } from "@/lib/editorial/posts";
import { prisma } from "@/lib/db";

const MARKET = "US";

export const revalidate = 120;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const merchants = await catalogOrEmpty(
    () => listActiveMerchants({ market: MARKET, limit: 200 }),
    [],
  );
  return merchants.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorePageData({ market: MARKET, slug });
  if (!data) return { title: "Store not found" };
  return {
    title: storePageTitle(data.merchant.name),
    description: data.merchant.description ?? undefined,
  };
}

function formatWhen(value: Date | null): string | null {
  if (!value) return null;
  return value.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function scheduleLabel(startsAt: Date | null, endsAt: Date | null): string | null {
  const end = formatWhen(endsAt);
  if (end) return `Ends ${end}`;
  return startsAt ? "Ongoing" : null;
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const data = await getStorePageData({ market: MARKET, slug });
  if (!data) notFound();

  const { merchant, offers } = data;
  const [guides, editor] = await Promise.all([
    catalogOrEmpty(() => listPublishedPostsForMerchant(merchant.id, 3), []),
    catalogOrEmpty(() => prisma.author.findUnique({ where: { slug: "editors" } }), null),
  ]);
  const trust = storeTrustStats(offers, new Date());
  const items: StoreOfferItem[] = offers.map((offer) => ({
    id: offer.id,
    title: offer.title,
    description: offer.description,
    discountLabel: offer.discountLabel,
    terms: offer.terms,
    code: offer.code,
    goHref: `/go/${offer.id}`,
    ctaLabel: offerCtaLabel(offer.code),
    badges: offerBadges(offer).filter((badge) => badge.label !== "Featured"),
    verifiedLabel: formatWhen(offer.verifiedAt),
    scheduleLabel: scheduleLabel(offer.startsAt, offer.endsAt),
    usedCount: offer.clickCount,
    channelLabel: channelLabel(offer.channel),
    isFeatured: offer.isFeatured,
  }));

  return (
    <main>
      <Container className="space-y-8 py-8 md:py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-on-surface-variant">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-primary">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/stores" className="hover:text-primary">Stores</Link></li>
            <li aria-hidden>/</li>
            <li className="font-medium text-on-surface">{merchant.name}</li>
          </ol>
        </nav>
        <MerchantHero
          name={merchant.name}
          description={merchant.description}
          siteUrl={merchant.siteUrl}
          logoUrl={merchant.logoUrl}
          activeOfferCount={offers.length}
        />
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="rounded-xl border border-outline-variant/60 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Active</p>
            <p className="text-2xl font-bold text-[#059669]">{trust.activeCount}</p>
          </li>
          <li className="rounded-xl border border-outline-variant/60 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Added today</p>
            <p className="text-2xl font-bold">{trust.addedToday}</p>
          </li>
          <li className="rounded-xl border border-outline-variant/60 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Last verified</p>
            <p className="text-lg font-bold">{formatWhen(trust.lastVerified) ?? "—"}</p>
          </li>
        </ul>
        {editor ? (
          <p className="text-sm text-on-surface-variant">Curated by {editor.name}</p>
        ) : null}
        <p className="text-sm text-on-surface-variant">Cashback is coming soon.</p>
        <StoreOfferBoard offers={items} />
        {guides.length > 0 ? (
          <section aria-labelledby="guides-heading">
            <h2 id="guides-heading" className="mb-4 text-xl font-bold">Guides</h2>
            <ul className="space-y-2">
              {guides.map((post) => (
                <li key={post.id}>
                  <Link href={`/blog/${post.slug}`} className="text-primary hover:underline">{post.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <Card className="p-5">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-on-surface-variant">
            About {merchant.name}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {merchant.description ?? `Find the latest coupons and deals for ${merchant.name} on AffiliateHub.`}
          </p>
        </Card>
      </Container>
    </main>
  );
}
