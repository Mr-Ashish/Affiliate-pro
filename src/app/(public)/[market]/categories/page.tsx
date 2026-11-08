import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { listPublicCategories } from "@/lib/catalog/categories";
import { catalogOrEmpty } from "@/lib/db-prerender";
import { marketPath, parseMarketParam } from "@/lib/market/path";

export const revalidate = 120;
export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ market: string }>;
}) {
  const market = parseMarketParam((await params).market);
  if (!market) notFound();
  const categories = await catalogOrEmpty(() => listPublicCategories(market), []);

  return (
    <main>
      <Container className="space-y-8 py-10">
        <div>
          <h1 className="text-3xl font-bold text-on-surface md:text-4xl">Categories</h1>
          <p className="mt-1 text-on-surface-variant">
            Browse deals by category.
          </p>
        </div>
        {categories.length === 0 ? (
          <p className="text-on-surface-variant">No categories with live deals yet.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={marketPath(market, `/category/${category.slug}`)}>
                  <Card hover className="h-full space-y-2 rounded-2xl p-5">
                    <p className="font-semibold text-on-surface">{category.name}</p>
                    {category.description ? (
                      <p className="text-sm text-on-surface-variant">{category.description}</p>
                    ) : null}
                    <p className="text-sm font-semibold text-primary-deep">
                      {category.offerCount} {category.offerCount === 1 ? "offer" : "offers"}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </main>
  );
}
