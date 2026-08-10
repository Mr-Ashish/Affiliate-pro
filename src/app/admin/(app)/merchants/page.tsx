import { MerchantsTable } from "@/components/admin/MerchantsTable";
import { listMerchantsWithOfferCounts } from "@/lib/catalog/merchants";

export default async function AdminMerchantsPage() {
  const merchants = await listMerchantsWithOfferCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Merchants</h1>
        <p className="text-sm text-on-surface-variant">
          Manage store partners in the catalog.
        </p>
      </div>
      <MerchantsTable
        merchants={merchants.map((m) => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          market: m.market,
          siteUrl: m.siteUrl,
          logoUrl: m.logoUrl,
          isActive: m.isActive,
          offerCount: m.offerCount,
        }))}
      />
    </div>
  );
}
