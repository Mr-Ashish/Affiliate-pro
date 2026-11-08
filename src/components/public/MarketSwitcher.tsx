"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/public/MaterialIcon";
import { cn } from "@/lib/ui/cn";
import { swapMarketPath } from "@/lib/market/path";

export type MarketOption = {
  code: string;
  short: string;
  name: string;
};

export function MarketSwitcher({
  market,
  markets,
}: {
  market: string;
  markets: MarketOption[];
}) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const options = markets ?? [];
  const selected =
    options.find((option) => option.code === market) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const timer = window.setTimeout(() => {
      document.addEventListener("click", onClick);
    }, 0);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!selected || options.length === 0) return null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={`Region: ${selected.name}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-full border bg-slate-50 pl-3 pr-2.5 text-sm font-semibold text-slate-900",
          "border-slate-200 transition-colors hover:border-emerald-500 hover:bg-[#ECFDF5]",
          "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
          open && "border-emerald-500 bg-[#ECFDF5] ring-2 ring-emerald-500/30",
        )}
      >
        <MaterialIcon name="public" size={18} className="text-emerald-600" />
        <span>{selected.short}</span>
        <MaterialIcon
          name="expand_more"
          size={18}
          className={cn("text-slate-400", open && "text-emerald-600")}
        />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Region"
          className="absolute right-0 z-50 mt-2 min-w-[13.5rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-[var(--shadow-card-hover)]"
        >
          {options.map((option) => {
            const isSelected = option.code === selected.code;
            const href = swapMarketPath(pathname, option.code);
            return (
              <li key={option.code} role="presentation">
                <Link
                  href={href}
                  role="option"
                  aria-selected={isSelected}
                  onClick={(event) => {
                    event.preventDefault();
                    setOpen(false);
                    if (option.code !== market) router.push(href);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-[#ECFDF5] font-semibold text-emerald-700"
                      : "font-medium text-slate-700 hover:bg-[#ECFDF5] hover:text-emerald-700",
                  )}
                >
                  <span>
                    <span className="block leading-tight">{option.name}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {option.short}
                    </span>
                  </span>
                  {isSelected ? (
                    <MaterialIcon
                      name="check"
                      size={18}
                      className="text-emerald-600"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
