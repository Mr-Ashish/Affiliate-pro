"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  return (
    <nav
      aria-label="Primary"
      className="-mb-px flex items-center gap-6 overflow-x-auto"
    >
      {publicNav.map((item) => {
        const active =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`) ||
          (item.href === "/stores" && pathname.startsWith("/store/"));
        return (
          <Link
            key={item.href}
            href={item.href}
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
