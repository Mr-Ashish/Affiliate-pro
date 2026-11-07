"use client";

import { useState } from "react";
import { CouponCodeBox } from "@/components/public/CouponCodeBox";
import { MaterialIcon } from "@/components/public/MaterialIcon";
import { maskCouponCode } from "@/lib/catalog/offer-display";
import { cn } from "@/lib/ui/cn";

export function ShowCodeButton({
  code,
  goHref,
  label,
  className,
}: {
  code: string | null;
  goHref: string;
  label: string;
  className?: string;
}) {
  const [shown, setShown] = useState(false);
  const cta = cn(
    "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#10B981] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#059669] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#10B981]/30 focus-visible:ring-offset-2",
    className,
  );

  if (!code) {
    return (
      <a href={goHref} target="_blank" rel="noopener noreferrer" className={cta}>
        {label}
        <MaterialIcon name="open_in_new" size={18} />
      </a>
    );
  }

  const copyCode = () => {
    setShown(true);
    void navigator.clipboard?.writeText(code).catch(() => undefined);
  };

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <CouponCodeBox
        code={shown ? code : maskCouponCode(code)}
        copied={shown}
        onCopy={copyCode}
        className="min-w-0 flex-1"
      />
      <button
        type="button"
        className={cta}
        onClick={() => {
          if (!shown) copyCode();
          window.open(goHref, "_blank", "noopener,noreferrer");
        }}
      >
        <MaterialIcon name={shown ? "check" : "content_cut"} size={18} />
        {shown ? "Copied" : label}
      </button>
    </div>
  );
}
