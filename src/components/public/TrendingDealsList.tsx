import Link from "next/link";
import { MaterialIcon } from "@/components/public/MaterialIcon";
import { MerchantAvatar } from "@/components/public/MerchantAvatar";
import type { ListOffer } from "@/components/public/ExclusiveCodesList";

export type TrendingDealsListProps = {
  offers: ListOffer[];
};

const rowShell =
  "flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0]/80 bg-[#F8FAFC] p-3 transition-colors hover:bg-[#ECFDF5]/40";

const ctaClass =
  "inline-flex shrink-0 items-center justify-center rounded-lg bg-[#10B981] px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#059669] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#10B981]/30";

function TrendingRow({ offer }: { offer: ListOffer }) {
  const ctaLabel = offer.code ? "Get Code" : "Get Deal";

  return (
    <li className={rowShell}>
      <div className="flex min-w-0 items-center gap-3">
        <MerchantAvatar
          name={offer.merchantName}
          logoUrl={offer.merchantLogoUrl}
          className="h-11 w-11 shrink-0 text-sm"
        />
        <div className="min-w-0">
          <p className="font-display text-sm font-bold leading-snug text-[#0F172A]">{offer.title}</p>
          {offer.discountLabel ? (
            <span className="mt-0.5 inline-flex rounded border border-[#FECDD3] bg-[#FFF1F2] px-1.5 py-0.5 text-[11px] font-bold text-[#BE123C]">
              {offer.discountLabel}
            </span>
          ) : null}
        </div>
      </div>
      <a href={offer.goHref} target="_blank" rel="noopener noreferrer" className={ctaClass}>
        {ctaLabel}
      </a>
    </li>
  );
}

export function TrendingDealsList({ offers }: TrendingDealsListProps) {
  return (
    <section
      aria-labelledby="trending-offers-heading"
      className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[var(--shadow-card)] md:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <MaterialIcon
            name="local_fire_department"
            size={22}
            filled
            className="text-[#F59E0B]"
          />
          <h2 id="trending-offers-heading" className="font-display text-xl font-bold text-[#0F172A]">
            Trending offers
          </h2>
        </div>
        <Link
          href="/trending"
          className="text-xs font-bold text-[#059669] hover:text-[#047857] hover:underline"
        >
          View all ›
        </Link>
      </div>

      {offers.length === 0 ? (
        <p className="text-sm text-[#64748B]">No trending offers at the moment. Check back soon.</p>
      ) : (
        <ul className="space-y-3">
          {offers.map((offer) => (
            <TrendingRow key={offer.id} offer={offer} />
          ))}
        </ul>
      )}
    </section>
  );
}
