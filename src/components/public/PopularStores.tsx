import Link from "next/link";
import { MerchantAvatar } from "@/components/public/MerchantAvatar";

export type PopularStoreItem = {
  name: string;
  slug: string;
  logoUrl?: string | null;
  offerCount?: number;
};

export type PopularStoresProps = {
  stores: PopularStoreItem[];
};

export function PopularStores({ stores }: PopularStoresProps) {
  if (stores.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">
        No stores yet. Check back soon.
      </p>
    );
  }

  return (
    <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
      {stores.map((s) => (
        <li key={s.slug} className="shrink-0">
          <Link
            href={`/store/${s.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white py-1.5 pl-1.5 pr-4 text-sm font-semibold text-[#0F172A] shadow-[var(--shadow-card)] transition hover:border-[#10B981]/50 hover:text-[#059669] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#10B981]/20"
          >
            <MerchantAvatar name={s.name} logoUrl={s.logoUrl} className="h-7 w-7 text-[10px]" />
            <span className="whitespace-nowrap">{s.name}</span>
            {typeof s.offerCount === "number" ? (
              <span className="whitespace-nowrap text-xs font-semibold text-[#059669]">
                {s.offerCount} {s.offerCount === 1 ? "Offer" : "Offers"}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
