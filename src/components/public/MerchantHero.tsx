import { MaterialIcon } from "@/components/public/MaterialIcon";
import { MerchantAvatar } from "@/components/public/MerchantAvatar";

export type MerchantHeroProps = {
  name: string;
  description?: string | null;
  siteUrl: string;
  logoUrl?: string | null;
  activeOfferCount: number;
};

export function MerchantHero({
  name,
  description,
  siteUrl,
  logoUrl,
  activeOfferCount,
}: MerchantHeroProps) {
  return (
    <section className="rounded-2xl border border-outline-variant/60 bg-white p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <MerchantAvatar name={name} logoUrl={logoUrl} size="lg" className="h-20 w-20 text-2xl" />
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/10 px-3 py-1 text-xs font-semibold text-[#059669]">
            <MaterialIcon name="verified" size={16} filled />
            Verified Merchant Partner
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-on-surface">{name}</h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">
            {description ?? `Coupons and promo codes for ${name}.`}
          </p>
          <p className="mt-3 text-sm text-on-surface-variant">
            <strong className="text-on-surface">{activeOfferCount}</strong> active offer
            {activeOfferCount === 1 ? "" : "s"}
          </p>
        </div>
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#10B981] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#059669] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#10B981]/30 focus-visible:ring-offset-2"
        >
          Visit Store
          <MaterialIcon name="open_in_new" size={18} />
        </a>
      </div>
    </section>
  );
}
