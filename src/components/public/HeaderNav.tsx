"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMarketPath } from "@/components/public/MarketProvider";
import { cn } from "@/lib/ui/cn";

export const publicNav = [
  { href: "/stores", label: "Stores" },
  { href: "/categories", label: "Categories" },
  { href: "/deals", label: "Deals" },
  { href: "/blog", label: "Blog" },
  { href: "/trending", label: "Trending" },
] as const;

export function HeaderNav() {
  const pathname = usePathname() ?? "/";
  const hrefFor = useMarketPath();
  return (
    <nav
      aria-label="Primary"
      className="-mb-px flex items-center gap-6 overflow-x-auto"
    >
      {publicNav.map((item) => {
        const href = hrefFor(item.href);
        const active =
          pathname === href ||
          pathname.startsWith(`${href}/`) ||
          (item.href === "/stores" && pathname.includes("/store/")) ||
          (item.href === "/categories" && pathname.includes("/category/"));
        return (
          <Link
            key={item.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap border-b-2 py-3 text-sm font-semibold transition-colors",
              active
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-emerald-600",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
