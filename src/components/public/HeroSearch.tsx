import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function HeroSearch() {
  return (
    <section className="relative overflow-hidden rounded-xl bg-surface-low px-6 py-16 text-center md:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(var(--primary-action) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-2xl">
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-on-surface md:text-5xl">
          Save more at your favorite stores with verified coupons.
        </h1>
        <p className="mb-8 text-base text-on-surface-variant md:text-lg">
          AffiliateHub surfaces trusted promo codes and deals — always tracked
          through our secure redirects.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/stores">
            <Button variant="primary" size="lg">
              Browse Top Deals
            </Button>
          </Link>
          <form
            action="/stores"
            method="get"
            className="relative w-full max-w-sm"
            role="search"
          >
            <Icon
              icon={Search}
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
            />
            <input
              type="search"
              name="q"
              placeholder="Search stores…"
              className="h-12 w-full rounded-md border border-outline-variant bg-surface-lowest pl-9 pr-3 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Search stores from hero"
            />
          </form>
        </div>
      </div>
    </section>
  );
}
