"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MaterialIcon } from "@/components/public/MaterialIcon";
import { ShowCodeButton } from "@/components/public/ShowCodeButton";
import { Container } from "@/components/ui/Container";
import type { BadgeTone } from "@/components/ui/Badge";

export type DealListItem = {
  id: string;
  title: string;
  description: string | null;
  merchantName: string;
  merchantSlug: string;
  merchantLogoUrl?: string | null;
  imageUrl: string;
  code: string | null;
  goHref: string;
  ctaLabel: "Get Code" | "Shop Deal";
  discountLabel: string | null;
  badges: { label: string; tone: BadgeTone }[];
  terms?: string | null;
  endsAt?: string | null;
};

function MerchantBadge({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "?";
  return (
    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[var(--shadow-card)]">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
      ) : (
        <span aria-hidden className="text-sm font-bold text-[#047857]">
          {initials}
        </span>
      )}
    </span>
  );
}

function footerLabel(endsAt?: string | null) {
  if (!endsAt) return "Ongoing Offer";
  const date = new Date(endsAt);
  if (Number.isNaN(date.getTime())) return "Ongoing Offer";
  return `Ends ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}`;
}

export function DealsBrowser({
  deals,
  shops,
}: {
  deals: DealListItem[];
  shops: { name: string; slug: string; offerCount: number }[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = deals.find((deal) => deal.id === openId) ?? null;

  useEffect(() => {
    if (!openId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  return (
    <div>
      {shops.length > 0 ? (
        <section aria-label="Popular shops" className="border-b border-[#E2E8F0] bg-white">
          <Container className="flex items-center gap-4 py-3">
            <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#0F172A]">
              <MaterialIcon name="local_fire_department" size={20} filled className="text-[#F59E0B]" />
              Popular Shops
            </span>
            <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
              {shops.map((shop) => (
                <li key={shop.slug} className="shrink-0">
                  <Link
                    href={`/store/${shop.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-1.5 text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#10B981] hover:bg-[#ECFDF5] hover:text-[#047857]"
                  >
                    {shop.name}
                    <span className="text-xs font-medium text-[#64748B]">{shop.offerCount} offers</span>
                    <MaterialIcon name="arrow_forward" size={14} className="text-[#10B981]" />
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      <section className="relative overflow-hidden bg-[#0B1528] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.28),transparent_60%)]"
        />
        <Container className="relative py-14 md:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/60 bg-[#10B981]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#4EDEA3]">
            <MaterialIcon name="star" size={14} filled className="text-[#F59E0B]" />
            Handpicked
          </span>
          <h1 className="font-display mt-5 text-[32px] font-extrabold leading-tight tracking-[-0.02em] md:text-5xl">
            <span className="text-[#10B981]">Exclusive</span> Deals &amp; Promo Codes
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
            Browse {deals.length} active {deals.length === 1 ? "offer" : "offers"} from top stores, verified and ready to use.
          </p>
        </Container>
      </section>

      <Container className="py-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-[#64748B]">
          <Link href="/" className="hover:text-[#059669]">
            Home
          </Link>
          <MaterialIcon name="chevron_right" size={16} />
          <span className="font-semibold text-[#0F172A]">Deals</span>
        </nav>

        {deals.length === 0 ? (
          <p className="text-[#64748B]">No active offers yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {deals.map((deal) => {
              const exclusive = deal.badges.some((badge) => badge.tone === "exclusive");
              const hasCode = Boolean(deal.code && deal.code.trim());
              return (
                <li key={deal.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(deal.id)}
                    className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white text-left shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#10B981]/30"
                  >
                    <div className="relative h-44 w-full shrink-0 overflow-hidden bg-[#F1F5F9]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={deal.imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {exclusive ? (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-black/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                          <MaterialIcon name="star" size={12} filled className="text-[#F59E0B]" />
                          Exclusive
                        </span>
                      ) : null}
                    </div>
                    <div className="relative -mt-6 px-5">
                      <MerchantBadge name={deal.merchantName} logoUrl={deal.merchantLogoUrl} />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 px-5 pb-4 pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                          {deal.merchantName}
                        </span>
                        <span
                          className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white ${
                            hasCode ? "bg-[#10B981]" : "bg-[#0F172A]"
                          }`}
                        >
                          {hasCode ? "Code" : "Deal"}
                        </span>
                      </div>
                      {deal.discountLabel ? (
                        <p className="font-display text-sm font-bold text-[#059669]">{deal.discountLabel}</p>
                      ) : null}
                      <h2 className="font-display text-lg font-semibold leading-snug text-[#0F172A]">{deal.title}</h2>
                      {deal.description ? (
                        <p className="line-clamp-2 text-sm text-[#64748B]">{deal.description}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between border-t border-[#E2E8F0] px-5 py-3 text-sm font-semibold text-[#10B981]">
                      <span>{footerLabel(deal.endsAt)}</span>
                      <MaterialIcon
                        name="arrow_forward"
                        size={18}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Container>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="code-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpenId(null);
          }}
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.25)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <MerchantBadge name={open.merchantName} logoUrl={open.merchantLogoUrl} />
                <p className="truncate text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  {open.merchantName}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpenId(null)}
                className="rounded-lg p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>
            <h2 id="code-title" className="font-display text-xl font-bold text-[#0F172A]">
              {open.title}
            </h2>
            {open.description ? <p className="text-sm text-[#64748B]">{open.description}</p> : null}
            <ShowCodeButton code={open.code} goHref={open.goHref} label={open.ctaLabel} />
            {open.terms ? (
              <p className="border-t border-[#E2E8F0] pt-3 text-xs text-[#64748B]">
                <span className="font-semibold text-[#0F172A]">Terms: </span>
                {open.terms}
              </p>
            ) : null}
            <a
              href={open.goHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#10B981] hover:text-[#059669]"
            >
              Shop {open.merchantName}
              <MaterialIcon name="arrow_forward" size={16} />
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
