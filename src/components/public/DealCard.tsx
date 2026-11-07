import Link from "next/link";
import { MaterialIcon } from "@/components/public/MaterialIcon";
import { MerchantAvatar } from "@/components/public/MerchantAvatar";
import { ShowCodeButton } from "@/components/public/ShowCodeButton";
import { cn } from "@/lib/ui/cn";
import { formatVerifiedAgo } from "@/lib/ui/relative-time";
import type { DealCardViewModel } from "@/lib/ui/view-models";

export type DealCardProps = {
  deal: DealCardViewModel;
};

const chip =
  "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold leading-none";

function badgeChip(label: string, tone: string) {
  switch (tone) {
    case "ending-soon":
      return { label: "Ends Soon", className: "bg-[#FEF3C7] text-[#D97706]", icon: "schedule" };
    case "exclusive":
      return { label, className: "bg-[#0F172A] text-white", icon: "star" };
    case "featured":
      return { label: "Staff Pick", className: "bg-[#ECFDF5] text-[#047857]", icon: "thumb_up" };
    case "expired":
      return { label, className: "bg-red-50 text-[#EF4444]", icon: "event_busy" };
    case "draft":
      return { label, className: "bg-slate-100 text-[#64748B]", icon: null };
    default:
      return null;
  }
}

export function DealCard({ deal }: DealCardProps) {
  const chips = deal.badges
    .map((b) => badgeChip(b.label, b.tone))
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <MerchantAvatar name={deal.merchantName} logoUrl={deal.merchantLogoUrl} />
            <div className="min-w-0">
              <Link
                href={`/store/${deal.merchantSlug}`}
                className="block truncate text-xs font-semibold uppercase tracking-wide text-[#64748B] hover:text-[#059669]"
              >
                {deal.merchantName}
              </Link>
              {deal.channelLabel ? (
                <p className="text-xs text-[#64748B]">{deal.channelLabel}</p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {chips.map((c) => (
              <span key={c.label} className={cn(chip, c.className)}>
                {c.icon ? <MaterialIcon name={c.icon} size={14} filled={c.icon === "star"} /> : null}
                {c.label}
              </span>
            ))}
          </div>
        </div>
        {deal.discountLabel ? (
          <p className="font-display text-sm font-bold text-[#059669]">{deal.discountLabel}</p>
        ) : null}
        <h3 className="font-display text-lg font-semibold leading-snug text-[#0F172A]">
          {deal.title}
        </h3>
        {deal.description ? (
          <p className="line-clamp-2 text-sm text-[#64748B]">{deal.description}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 border-t border-[#E2E8F0] bg-[#F8FAFC] p-4">
        <ShowCodeButton code={deal.code} goHref={deal.goHref} label={deal.ctaLabel} />
        {deal.verifiedAt ? (
          <p className="text-xs font-medium text-[#64748B]">
            Verified {formatVerifiedAgo(deal.verifiedAt)}
          </p>
        ) : null}
      </div>
    </article>
  );
}
