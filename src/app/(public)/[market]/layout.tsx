import { notFound } from "next/navigation";
import { MarketProvider } from "@/components/public/MarketProvider";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";
import { TopStoresStrip } from "@/components/public/TopStoresStrip";
import { countActiveMerchants, listPopularMerchants } from "@/lib/catalog/merchants";
import { catalogOrEmpty } from "@/lib/db-prerender";
import { prisma } from "@/lib/db";
import { marketMeta, marketShortLabel } from "@/lib/market/meta";
import {
  SWITCHER_MARKET_CODES,
  isSwitcherMarket,
  parseMarketParam,
} from "@/lib/market/path";

export const revalidate = 120;

export function generateStaticParams() {
  return [{ market: "us" }];
}

async function resolveMarket(segment: string): Promise<string> {
  const code = parseMarketParam(segment);
  if (!code) notFound();
  if (isSwitcherMarket(code)) return code;
  const row = await catalogOrEmpty(
    () => prisma.market.findUnique({ where: { code } }),
    null,
  );
  if (!row?.isActive) notFound();
  return code;
}

export default async function MarketLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ market: string }>;
}) {
  const { market: segment } = await params;
  const market = await resolveMarket(segment);
  const [popular, totalCount, extraMarkets] = await Promise.all([
    catalogOrEmpty(() => listPopularMerchants({ market, limit: 12 }), []),
    catalogOrEmpty(() => countActiveMerchants({ market }), 0),
    catalogOrEmpty(
      () =>
        prisma.market.findMany({
          where: { isActive: true },
          select: { code: true },
          orderBy: { code: "asc" },
        }),
      [],
    ),
  ]);
  const marketCodes = [
    ...new Set([
      ...SWITCHER_MARKET_CODES,
      ...extraMarkets.map((row) => row.code.toUpperCase()),
    ]),
  ];
  const markets = marketCodes.map((code) => ({
    code,
    short: marketShortLabel(code),
    name: marketMeta(code).name,
  }));

  return (
    <MarketProvider market={market}>
      <SiteHeader market={market} markets={markets} />
      <TopStoresStrip
        market={market}
        stores={popular.map((m) => ({
          name: m.name,
          slug: m.slug,
          logoUrl: m.logoUrl,
          offerCount: m.offerCount,
        }))}
        totalCount={totalCount}
      />
      <div className="flex-1">{children}</div>
      <SiteFooter market={market} />
    </MarketProvider>
  );
}
