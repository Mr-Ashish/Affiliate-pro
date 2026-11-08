import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { OfferRow } from "@/components/public/OfferRow";
import { getPublicCategory } from "@/lib/catalog/categories";
import { marketPath, parseMarketParam } from "@/lib/market/path";
import { toOfferRowViewModel } from "@/lib/ui/view-models";

export const revalidate = 120;

type Props = { params: Promise<{ market: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { market: segment, slug } = await params;
  const market = parseMarketParam(segment);
  if (!market) return { title: "Category" };
  const data = await getPublicCategory(market, slug);
  if (!data) return { title: "Category" };
  return {
    title: `${data.category.name} Deals & Coupons`,
    description: data.category.description ?? undefined,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { market: segment, slug } = await params;
  const market = parseMarketParam(segment);
  if (!market) notFound();
  const data = await getPublicCategory(market, slug);
  if (!data) notFound();
  const rows = data.offers.map((offer) =>
    toOfferRowViewModel(offer, offer.merchant),
  );

  return (
    <main>
      <Container className="space-y-8 py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-on-surface-variant">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href={marketPath(market)} className="hover:text-primary">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href={marketPath(market, "/categories")} className="hover:text-primary">Categories</Link></li>
            <li aria-hidden>/</li>
            <li className="font-medium text-on-surface">{data.category.name}</li>
          </ol>
        </nav>
        <div>
          <h1 className="text-3xl font-bold text-on-surface md:text-4xl">{data.category.name}</h1>
          {data.category.description ? (
            <p className="mt-2 max-w-2xl text-on-surface-variant">{data.category.description}</p>
          ) : null}
        </div>
        {rows.length === 0 ? (
          <p className="text-on-surface-variant">No deals in this category</p>
        ) : (
          <Card className="px-4">
            <ul>
              {rows.map((offer) => (
                <OfferRow key={offer.id} offer={offer} />
              ))}
            </ul>
          </Card>
        )}
      </Container>
    </main>
  );
}
