import Link from "next/link";
import { MaterialIcon } from "@/components/public/MaterialIcon";
import { MerchantAvatar } from "@/components/public/MerchantAvatar";
import { Container } from "@/components/ui/Container";

export type TopStoreItem = {
  name: string;
  slug: string;
  logoUrl?: string | null;
  offerCount?: number;
};

export type TopStoresStripProps = {
  stores: TopStoreItem[];
  totalCount: number;
};

export function TopStoresStrip({ stores, totalCount }: TopStoresStripProps) {
  if (stores.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Top stores"
      className="border-b border-outline-variant bg-white py-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
    >
      <Container>
        <div className="flex items-center gap-3 overflow-x-auto [scrollbar-width:thin]">
          <p className="hidden shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#065F46] xl:flex">
            <MaterialIcon name="storefront" size={16} className="text-primary-deep" />
            Top Stores:
          </p>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {stores.map((store) => (
              <Link
                key={store.slug}
                href={`/store/${store.slug}`}
                className="group flex shrink-0 items-center gap-2.5 rounded-lg border border-outline-variant bg-slate-50 px-3 py-1.5 transition hover:border-primary-deep hover:bg-[#ECFDF5]/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
              >
                <MerchantAvatar
                  name={store.name}
                  logoUrl={store.logoUrl}
                  className="h-7 w-7 shrink-0 text-[10px]"
                />
                <span className="leading-tight">
                  <span className="block text-[13px] font-bold text-on-surface group-hover:text-primary-deep">
                    {store.name}
                  </span>
                  {typeof store.offerCount === "number" ? (
                    <span className="block text-[11px] font-semibold text-primary-deep">
                      {store.offerCount} {store.offerCount === 1 ? "Offer" : "Offers"}
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/stores"
            className="inline-flex shrink-0 items-center gap-0.5 px-2 py-1 text-xs font-bold text-primary-deep hover:text-[#047857] hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
          >
            All {totalCount.toLocaleString("en-US")} Stores
            <MaterialIcon name="chevron_right" size={16} />
          </Link>
        </div>
      </Container>
    </section>
  );
}
