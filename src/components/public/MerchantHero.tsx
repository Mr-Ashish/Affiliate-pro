import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
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
    <section className="rounded-xl border border-outline-variant/60 bg-surface-lowest p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <MerchantAvatar name={name} logoUrl={logoUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">
            {name}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-on-surface-variant">{description}</p>
          ) : (
            <p className="mt-2 text-on-surface-variant">
              Coupons and promo codes for {name}.
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
            <span>
              <strong className="text-on-surface">{activeOfferCount}</strong>{" "}
              active offer{activeOfferCount === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-4">
            <a href={siteUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Shop on {name}
                <Icon icon={ExternalLink} size={16} />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
