import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CouponCodeBox } from "@/components/public/CouponCodeBox";
import { MerchantHero } from "@/components/public/MerchantHero";
import {
  getStorePageData,
  storePageTitle,
} from "@/lib/catalog/store-page";
import { toDealCardViewModel } from "@/lib/ui/view-models";
import { listActiveMerchants } from "@/lib/catalog/merchants";
const MARKET = "US";

/** Must be a numeric literal for Next.js (see PUBLIC_PAGE_REVALIDATE_SECONDS). */
export const revalidate = 120;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const merchants = await listActiveMerchants({ market: MARKET, limit: 200 });
    return merchants.map((m) => ({ slug: m.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorePageData({ market: MARKET, slug });
  if (!data) {
    return { title: "Store not found" };
  }
  return {
    title: storePageTitle(data.merchant.name),
    description: data.merchant.description ?? undefined,
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const data = await getStorePageData({ market: MARKET, slug });

  if (!data) {
    notFound();
  }

  const { merchant, offers } = data;
  const cards = offers.map((o) => toDealCardViewModel(o, merchant));

  return (
    <main>
      <Container className="space-y-8 py-8 md:py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-on-surface-variant">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/stores" className="hover:text-primary">
                Stores
              </Link>
            </li>
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

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="space-y-4 lg:col-span-2" aria-labelledby="offers-heading">
            <h2 id="offers-heading" className="text-xl font-bold text-on-surface">
              Offers
            </h2>
            {cards.length === 0 ? (
              <p className="text-on-surface-variant">
                No active offers right now.
              </p>
            ) : (
              <ul className="space-y-4">
                {cards.map((deal) => (
                  <li key={deal.id}>
                    <Card hover className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {deal.badges.map((b) => (
                            <Badge key={b.label} tone={b.tone}>
                              {b.label}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-lg font-semibold text-on-surface">
                          {deal.title}
                        </p>
                        {deal.description ? (
                          <p className="text-sm text-on-surface-variant">
                            {deal.description}
                          </p>
                        ) : null}
                        {deal.code ? <CouponCodeBox code={deal.code} /> : null}
                      </div>
                      <a
                        href={deal.goHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={
                          deal.ctaLabel === "Get Code"
                            ? "inline-flex h-12 shrink-0 items-center justify-center rounded-md bg-secondary px-5 text-sm font-semibold text-on-secondary hover:bg-secondary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                            : "inline-flex h-12 shrink-0 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        }
                      >
                        {deal.ctaLabel}
                      </a>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="space-y-4">
            <Card className="p-5">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-on-surface-variant">
                About {merchant.name}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {merchant.description ??
                  `Find the latest coupons and deals for ${merchant.name} on AffiliateHub.`}
              </p>
            </Card>
            <Card className="p-5">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-on-surface-variant">
                Saving tips
              </h2>
              <ul className="list-disc space-y-1 pl-4 text-sm text-on-surface-variant">
                <li>Copy the code before checkout when shown.</li>
                <li>Use Get Code / Shop Deal so we can verify the offer.</li>
                <li>Check ending-soon badges for expiring promos.</li>
              </ul>
            </Card>
          </aside>
        </div>
      </Container>
    </main>
  );
}
