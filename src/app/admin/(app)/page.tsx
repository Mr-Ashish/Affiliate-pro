import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/admin/StatCard";
import { TopOffersTable } from "@/components/admin/TopOffersTable";
import {
  getAdminDashboardStats,
  listTopOffersByClicks,
} from "@/lib/catalog/offers";

export default async function AdminDashboardPage() {
  const [stats, topOffers] = await Promise.all([
    getAdminDashboardStats(),
    listTopOffersByClicks(10),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Dashboard</h1>
        <p className="text-sm text-on-surface-variant">
          Overview of catalog health and top performing offers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Offers" value={stats.activeOffers} />
        <StatCard label="Expired" value={stats.expiredOffers} />
        <StatCard label="Drafts" value={stats.draftOffers} />
        <StatCard label="Total Merchants" value={stats.merchantCount} />
      </div>

      <section className="space-y-3" aria-labelledby="top-offers-heading">
        <h2 id="top-offers-heading" className="text-lg font-semibold">
          Top Offers
        </h2>
        <TopOffersTable
          offers={topOffers.map((o) => ({
            id: o.id,
            title: o.title,
            code: o.code,
            clickCount: o.clickCount,
            status: o.status,
            merchantName: o.merchant.name,
          }))}
        />
      </section>

      <section className="space-y-3" aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-lg font-semibold">
          Recent Activity
        </h2>
        <Card className="p-6">
          <p className="text-sm text-on-surface-variant">No activity log yet</p>
        </Card>
      </section>
    </div>
  );
}
