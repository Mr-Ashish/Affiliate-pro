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
    <ul className="flex flex-wrap gap-3">
      {stores.map((s) => (
        <li key={s.slug}>
          <Link
            href={`/store/${s.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-lowest px-3 py-2 text-sm font-semibold text-on-surface shadow-[var(--shadow-card)] transition hover:border-primary/40 hover:text-primary"
          >
            <MerchantAvatar name={s.name} logoUrl={s.logoUrl} size="sm" />
            {s.name}
            {typeof s.offerCount === "number" ? (
              <span className="text-xs font-normal text-on-surface-variant">
                {s.offerCount}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
