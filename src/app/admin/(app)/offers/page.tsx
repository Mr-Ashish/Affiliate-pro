import { OffersTable } from "@/components/admin/OffersTable";
import { listOffers } from "@/lib/catalog/offers";

export default async function AdminOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const offers = await listOffers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Offers</h1>
        <p className="text-sm text-on-surface-variant">
          Active shows on the public site. Pause hides a code until you resume
          it. Retire marks it expired. Rows are never deleted (click history
          stays).
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-error-container px-3 py-2 text-sm text-error"
        >
          Error: {error}
        </p>
      ) : null}

      <OffersTable
        offers={offers.map((o) => ({
          id: o.id,
          title: o.title,
          code: o.code,
          offerType: o.offerType,
          status: o.status,
          clickCount: o.clickCount,
          merchantId: o.merchant.id,
          merchantName: o.merchant.name,
          merchantMarket: o.merchant.market,
          merchantSlug: o.merchant.slug,
        }))}
      />
    </div>
  );
}
