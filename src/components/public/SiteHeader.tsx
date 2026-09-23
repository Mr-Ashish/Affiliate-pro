import Link from "next/link";
import { Search } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/ui/cn";

const nav = [
  { href: "/stores", label: "Stores" },
  { href: "/blog", label: "Blog" },
  { href: "/categories", label: "Categories" },
  { href: "/deals", label: "Deals" },
  { href: "/trending", label: "Trending" },
] as const;

export type SiteHeaderProps = {
  activePath?: string;
};

export function SiteHeader({ activePath = "/" }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/60 bg-surface-lowest/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-xl font-black tracking-tight text-primary-deep"
          >
            AffiliateHub
          </Link>
          <nav className="hidden items-center gap-4 md:flex" aria-label="Primary">
            {nav.map((item) => {
              const active =
                activePath === item.href ||
                activePath.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    active
                      ? "border-b-2 border-primary pb-0.5 text-primary"
                      : "text-on-surface-variant hover:text-primary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <form
            action="/stores"
            method="get"
            className="relative hidden md:block"
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
              className="h-10 w-56 rounded-full border border-outline-variant bg-surface-low pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Search stores"
            />
          </form>
          <Link
            href="/admin/login"
            className="text-sm font-bold text-primary hover:text-primary-deep"
          >
            Admin
          </Link>
        </div>
      </Container>
    </header>
  );
}
