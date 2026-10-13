"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { MaterialIcon } from "@/components/public/MaterialIcon";
import { ShowCodeButton } from "@/components/public/ShowCodeButton";
import type { BadgeTone } from "@/components/ui/Badge";

export type StoreOfferItem = {
  id: string;
  title: string;
  description: string | null;
  discountLabel: string | null;
  terms: string | null;
  code: string | null;
  goHref: string;
  ctaLabel: "Get Code" | "Shop Deal";
  badges: { label: string; tone: BadgeTone }[];
  verifiedLabel: string | null;
  scheduleLabel: string | null;
  usedCount: number;
  channelLabel: string | null;
  isFeatured: boolean;
};

const filters = [
  { id: "all", label: "All" },
  { id: "codes", label: "Codes" },
  { id: "deals", label: "Deals" },
] as const;

type FilterId = (typeof filters)[number]["id"];

function matchesFilter(offer: StoreOfferItem, filter: FilterId) {
  if (filter === "all") return true;
  if (filter === "codes") return Boolean(offer.code);
  return !offer.code;
}

const chip =
  "inline-flex items-center gap-1 rounded-full bg-surface-low px-2.5 py-1 text-xs font-medium text-on-surface-variant";

export function StoreOfferBoard({ offers }: { offers: StoreOfferItem[] }) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [openTerms, setOpenTerms] = useState<string | null>(null);
  const visible = offers.filter((offer) => matchesFilter(offer, filter));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Offer type">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={
              filter === item.id
                ? "rounded-full bg-[#10B981] px-4 py-1.5 text-sm font-semibold text-white"
                : "rounded-full border border-outline-variant bg-white px-4 py-1.5 text-sm font-semibold text-on-surface hover:border-[#10B981] hover:text-[#059669]"
            }
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="text-on-surface-variant">No active offers right now.</p>
      ) : (
        <ul className="space-y-4">
          {visible.map((offer) => (
            <li key={offer.id}>
              <article className="relative flex flex-col gap-4 overflow-hidden rounded-xl border border-outline-variant/60 bg-white p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
                {offer.isFeatured ? (
                  <span className="absolute left-0 top-0 inline-flex items-center gap-1 rounded-br-lg bg-[#10B981] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    <MaterialIcon name="star" size={14} filled />
                    Staff Pick
                  </span>
                ) : null}
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#10B981]/10 px-1 text-center text-sm font-extrabold leading-tight text-[#059669]${offer.isFeatured ? " mt-6 sm:mt-6" : ""}`}
                >
                  {offer.discountLabel ?? (offer.code ? "CODE" : "DEAL")}
                </div>
                <div className={`min-w-0 flex-1 space-y-2${offer.isFeatured ? " sm:pt-6" : ""}`}>
                  <p className="text-lg font-semibold text-on-surface">{offer.title}</p>
                  {offer.description ? (
                    <p className="text-sm text-on-surface-variant">{offer.description}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    {offer.verifiedLabel ? (
                      <span className={`${chip} bg-[#10B981]/10 text-[#059669]`}>
                        <MaterialIcon name="verified" size={14} filled />
                        Verified {offer.verifiedLabel}
                      </span>
                    ) : null}
                    {offer.scheduleLabel ? (
                      <span className={chip}>
                        <MaterialIcon name="schedule" size={14} />
                        {offer.scheduleLabel}
                      </span>
                    ) : null}
                    {offer.channelLabel ? <span className={chip}>{offer.channelLabel}</span> : null}
                    {offer.badges.map((badge) => (
                      <Badge key={badge.label} tone={badge.tone}>
                        {badge.label}
                      </Badge>
                    ))}
                    {offer.usedCount > 0 ? (
                      <span className="text-xs text-on-surface-variant">Used {offer.usedCount} times</span>
                    ) : null}
                  </div>
                  {offer.terms ? (
                    <button
                      type="button"
                      className="text-sm font-semibold text-[#059669] hover:underline"
                      aria-expanded={openTerms === offer.id}
                      onClick={() => setOpenTerms(openTerms === offer.id ? null : offer.id)}
                    >
                      {openTerms === offer.id ? "Hide terms" : "Terms"}
                    </button>
                  ) : null}
                  {openTerms === offer.id && offer.terms ? (
                    <p className="text-sm text-on-surface-variant">{offer.terms}</p>
                  ) : null}
                </div>
                <div className="w-full shrink-0 sm:w-auto sm:min-w-72">
                  <ShowCodeButton code={offer.code} goHref={offer.goHref} label={offer.ctaLabel} />
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
