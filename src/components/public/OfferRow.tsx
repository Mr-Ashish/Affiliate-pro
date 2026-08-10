import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { OfferRowViewModel } from "@/lib/ui/view-models";
import { cn } from "@/lib/ui/cn";

export type OfferRowProps = {
  offer: OfferRowViewModel;
};

const ctaClass =
  "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

export function OfferRow({ offer }: OfferRowProps) {
  return (
    <li className="flex flex-col gap-3 border-b border-outline-variant/40 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap gap-1">
          {offer.badges.map((b) => (
            <Badge key={b.label} tone={b.tone}>
              {b.label}
            </Badge>
          ))}
        </div>
        <p className="font-semibold text-on-surface">{offer.title}</p>
        <Link
          href={`/store/${offer.merchantSlug}`}
          className="text-sm text-on-surface-variant hover:text-primary"
        >
          {offer.merchantName}
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {offer.code ? (
          <code className="font-code text-sm font-semibold tracking-wide text-secondary-deep">
            {offer.code}
          </code>
        ) : null}
        <a
          href={offer.goHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            ctaClass,
            offer.ctaLabel === "Get Code"
              ? "bg-secondary text-on-secondary hover:bg-secondary-deep focus-visible:ring-secondary"
              : "border border-outline-variant bg-surface-lowest text-on-surface hover:border-primary hover:text-primary focus-visible:ring-primary",
          )}
        >
          {offer.ctaLabel}
        </a>
      </div>
    </li>
  );
}
