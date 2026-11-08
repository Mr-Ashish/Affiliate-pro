import Link from "next/link";
import { notFound } from "next/navigation";
import { setOfferCategoriesAction } from "@/app/admin/actions";
import { listActiveCategories } from "@/lib/catalog/categories";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default async function OfferCategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const error = (await searchParams).error;
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      merchant: { select: { name: true, market: true } },
      categories: { select: { categoryId: true } },
    },
  });
  if (!offer) notFound();
  const categories = await listActiveCategories();
  const selected = new Set(offer.categories.map((row) => row.categoryId));

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="mb-2 text-sm">
          <Link href="/admin/offers" className="font-medium text-primary hover:underline">← Offers</Link>
        </p>
        <h1 className="text-2xl font-bold text-on-surface">Assign categories</h1>
        <p className="text-sm text-on-surface-variant">
          {offer.title} · {offer.merchant.name} ({offer.merchant.market})
        </p>
      </div>
      {error ? <p role="alert" className="rounded-md bg-error-container px-3 py-2 text-sm text-error">Error: {error}</p> : null}
      <Card className="p-6">
        <form action={setOfferCategoriesAction} className="space-y-4">
          <input type="hidden" name="offerId" value={offer.id} />
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Categories</legend>
            {categories.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No active categories.</p>
            ) : (
              categories.map((category) => (
                <label key={category.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="categoryIds"
                    value={category.id}
                    defaultChecked={selected.has(category.id)}
                  />
                  {category.name}
                </label>
              ))
            )}
          </fieldset>
          <Button type="submit" variant="primary">Save categories</Button>
        </form>
      </Card>
    </div>
  );
}
