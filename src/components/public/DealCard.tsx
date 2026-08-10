import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CouponCodeBox } from "@/components/public/CouponCodeBox";
import { MerchantAvatar } from "@/components/public/MerchantAvatar";
import type { DealCardViewModel } from "@/lib/ui/view-models";
import { cn } from "@/lib/ui/cn";

export type DealCardProps = {
  deal: DealCardViewModel;
};

const ctaClass =
  "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

export function DealCard({ deal }: DealCardProps) {
  return (
    <Card hover className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <MerchantAvatar
            name={deal.merchantName}
            logoUrl={deal.merchantLogoUrl}
          />
          <div>
            <Link
              href={`/store/${deal.merchantSlug}`}
              className="text-sm font-semibold text-on-surface hover:text-primary"
            >
              {deal.merchantName}
            </Link>
            {deal.discountLabel ? (
              <p className="text-xs font-bold text-secondary">{deal.discountLabel}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {deal.badges.map((b) => (
            <Badge key={b.label} tone={b.tone}>
              {b.label}
            </Badge>
          ))}
        </div>
      </div>
      <h3 className="text-base font-semibold text-on-surface">{deal.title}</h3>
      {deal.description ? (
        <p className="line-clamp-2 text-sm text-on-surface-variant">
          {deal.description}
        </p>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        {deal.code ? <CouponCodeBox code={deal.code} /> : null}
        <a
          href={deal.goHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            ctaClass,
            deal.ctaLabel === "Get Code"
              ? "bg-secondary text-on-secondary hover:bg-secondary-deep focus-visible:ring-secondary"
              : "bg-primary text-on-primary hover:bg-primary-deep focus-visible:ring-primary",
          )}
        >
          {deal.ctaLabel}
        </a>
      </div>
    </Card>
  );
}
