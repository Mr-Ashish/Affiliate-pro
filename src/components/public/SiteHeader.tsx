import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { HeaderNav } from "@/components/public/HeaderNav";
import { MaterialIcon } from "@/components/public/MaterialIcon";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="AffiliateHub home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <MaterialIcon name="savings" size={20} filled />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-slate-900">
              Affiliate<span className="text-[#10B981]">Hub</span>
            </span>
          </Link>
          <div className="flex flex-1 items-center justify-end gap-4">
            <form
              action="/stores"
              method="get"
              role="search"
              className="relative hidden w-full max-w-md md:block"
            >
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <MaterialIcon name="search" size={20} />
              </span>
              <input
                type="search"
                name="q"
                placeholder="Search stores & verified deals…"
                aria-label="Search stores"
                className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </form>
            <Link
              href="/admin/login"
              className="text-xs font-medium text-slate-500 hover:text-emerald-600"
            >
              Admin
            </Link>
          </div>
        </div>
        <HeaderNav />
      </Container>
      <div className="border-t border-slate-100 bg-slate-50">
        <Container>
          <p className="py-1.5 text-[11px] leading-snug text-slate-500">
            Affiliate disclosure: we may earn a commission when you use our links
            or codes, at no extra cost to you.
          </p>
        </Container>
      </div>
    </header>
  );
}
