"use client";

import Link from "next/link";
import { useState } from "react";
import { CouponCodeBox } from "@/components/public/CouponCodeBox";
import { MaterialIcon } from "@/components/public/MaterialIcon";
import { MerchantAvatar } from "@/components/public/MerchantAvatar";
import { maskCouponCode } from "@/lib/catalog/offer-display";
import { formatVerifiedAgo } from "@/lib/ui/relative-time";

export type ListOffer = {
  id: string;
  title: string;
  code: string | null;
  goHref: string;
  discountLabel?: string | null;
  verifiedAt?: Date | null;
  merchantName: string;
  merchantLogoUrl?: string | null;
};

export type ExclusiveCodesListProps = {
  offers: ListOffer[];
};

const rowShell =
  "flex flex-col gap-3 rounded-xl border border-[#E2E8F0]/80 bg-[#F8FAFC] p-3 transition-colors hover:bg-[#ECFDF5]/40 sm:flex-row sm:items-center sm:justify-between";

const btnPrimary =
  "inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-[#10B981] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#059669] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#10B981]/30";

const btnSecondary =
  "inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#0F172A] transition-colors hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#10B981]/20";

function ExclusiveRowActions({ code, goHref }: { code: string | null; goHref: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (!code) return;
    setCopied(true);
    void navigator.clipboard?.writeText(code).catch(() => undefined);
  };

  if (!code) {
    return (
      <a
        href={goHref}
        target="_blank"
        rel="noopener noreferrer"
        className={btnPrimary}
      >
        Shop Deal
        <MaterialIcon name="open_in_new" size={14} />
      </a>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 self-end sm:self-center">
      <CouponCodeBox
        code={copied ? code : maskCouponCode(code)}
        copied={copied}
        onCopy={copyCode}
        className="h-8 max-w-[140px] px-2 text-[11px] font-bold tracking-[0.04em]"
      />
      <button type="button" className={btnPrimary} onClick={copyCode}>
        {copied ? "Copied" : "Copy"}
      </button>
      <a href={goHref} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
        Shop
        <MaterialIcon name="open_in_new" size={14} />
      </a>
    </div>
  );
}

function ExclusiveRow({ offer }: { offer: ListOffer }) {
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
          {offer.verifiedAt ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-[#059669]">
              <MaterialIcon name="verified" size={14} filled className="text-[#059669]" />
              Tested {formatVerifiedAgo(offer.verifiedAt)}
            </p>
          ) : null}
        </div>
      </div>
      <ExclusiveRowActions code={offer.code} goHref={offer.goHref} />
    </li>
  );
}

export function ExclusiveCodesList({ offers }: ExclusiveCodesListProps) {
  return (
    <section
      aria-labelledby="exclusive-partner-codes-heading"
      className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[var(--shadow-card)] md:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <MaterialIcon name="stars" size={22} filled className="text-[#059669]" />
          <h2
            id="exclusive-partner-codes-heading"
            className="font-display text-xl font-bold text-[#0F172A]"
          >
            Exclusive Partner Codes
          </h2>
        </div>
        <span className="inline-flex items-center rounded-full border border-[#A7F3D0] bg-[#ECFDF5]/70 px-2.5 py-0.5 text-xs font-bold text-[#065F46]">
          Only on AffiliateHub
        </span>
      </div>

      {offers.length === 0 ? (
        <p className="text-sm text-[#64748B]">
          No exclusive codes right now.{" "}
          <Link href="/deals" className="font-semibold text-[#059669] hover:underline">
            Browse all deals
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {offers.map((offer) => (
            <ExclusiveRow key={offer.id} offer={offer} />
          ))}
        </ul>
      )}
    </section>
  );
}
