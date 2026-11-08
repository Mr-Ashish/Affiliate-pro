import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addOfferToCategoryAction,
  removeOfferFromCategoryAction,
  updateCategoryAction,
} from "@/app/admin/actions";
import { getCategoryAdmin, searchOffersForAssign } from "@/lib/catalog/categories";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; q?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const category = await getCategoryAdmin(id);
  if (!category) notFound();
  const q = (query.q ?? "").trim();
  const matches = q ? await searchOffersForAssign(q) : [];
  const linkedIds = new Set(category.offers.map((row) => row.offerId));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="mb-2 text-sm">
          <Link href="/admin/categories" className="font-medium text-primary hover:underline">← Categories</Link>
        </p>
        <h1 className="text-2xl font-bold text-on-surface">{category.name}</h1>
      </div>
      {query.error ? (
        <p role="alert" className="rounded-md bg-error-container px-3 py-2 text-sm text-error">Error: {query.error}</p>
      ) : null}

      <Card className="p-6">
        <form action={updateCategoryAction} className="space-y-4">
          <input type="hidden" name="id" value={category.id} />
          <input type="hidden" name="previousSlug" value={category.slug} />
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <Input id="name" name="name" required defaultValue={category.name} />
          </div>
          <div className="space-y-1">
            <label htmlFor="slug" className="text-sm font-medium">Slug</label>
            <Input id="slug" name="slug" required defaultValue={category.slug} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
          </div>
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Input id="description" name="description" defaultValue={category.description ?? ""} />
          </div>
          <div className="space-y-1">
            <label htmlFor="sortOrder" className="text-sm font-medium">Sort order</label>
            <Input id="sortOrder" name="sortOrder" type="number" defaultValue={category.sortOrder} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" value="on" defaultChecked={category.isActive} /> Active
          </label>
          <Button type="submit" variant="primary">Save category</Button>
        </form>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-on-surface">Offers in this category</h2>
        {category.offers.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No offers assigned yet.</p>
        ) : (
          <ul className="divide-y divide-outline-variant/40 rounded-md border border-outline-variant/60">
            {category.offers.map((row) => (
              <li key={row.offerId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{row.offer.title}</span>
                  <span className="text-on-surface-variant"> · {row.offer.merchant.name} · {row.offer.status}</span>
                </span>
                <form action={removeOfferFromCategoryAction}>
                  <input type="hidden" name="categoryId" value={category.id} />
                  <input type="hidden" name="offerId" value={row.offerId} />
                  <Button type="submit" variant="ghost" size="sm">Remove</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-on-surface">Assign an existing offer</h2>
        <form className="flex gap-2" method="get">
          <Input name="q" defaultValue={q} placeholder="Search title, code, or merchant" aria-label="Search offers" />
          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </form>
        {q && q.length < 2 ? <p className="text-sm text-on-surface-variant">Type at least 2 characters.</p> : null}
        {q.length >= 2 && matches.length === 0 ? <p className="text-sm text-on-surface-variant">No offers match.</p> : null}
        <ul className="space-y-2">
          {matches.map((offer) => (
            <li key={offer.id} className="flex items-center justify-between gap-3 text-sm">
              <span>{offer.title} · {offer.merchant.name} ({offer.merchant.market})</span>
              {linkedIds.has(offer.id) ? (
                <span className="text-on-surface-variant">Assigned</span>
              ) : (
                <form action={addOfferToCategoryAction}>
                  <input type="hidden" name="categoryId" value={category.id} />
                  <input type="hidden" name="offerId" value={offer.id} />
                  <input type="hidden" name="q" value={q} />
                  <Button type="submit" size="sm">Add</Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
