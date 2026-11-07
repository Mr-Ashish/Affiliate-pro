import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";
import { TopStoresStrip } from "@/components/public/TopStoresStrip";
import { countActiveMerchants, listPopularMerchants } from "@/lib/catalog/merchants";
import { catalogOrEmpty } from "@/lib/db-prerender";

const MARKET = "US";
export const revalidate = 120;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [popular, totalCount] = await Promise.all([
    catalogOrEmpty(() => listPopularMerchants({ market: MARKET, limit: 12 }), []),
    catalogOrEmpty(() => countActiveMerchants({ market: MARKET }), 0),
  ]);

  return (
    <div className="public-theme flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <TopStoresStrip
        stores={popular.map((m) => ({
          name: m.name,
          slug: m.slug,
          logoUrl: m.logoUrl,
          offerCount: m.offerCount,
        }))}
        totalCount={totalCount}
      />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
