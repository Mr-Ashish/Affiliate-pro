import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { listPopularMerchants } from "@/lib/catalog/merchants";
import { catalogOrEmpty } from "@/lib/db-prerender";

const MARKET = "US";

const company = [
  { href: "/coming-soon", label: "About" },
  { href: "/coming-soon", label: "Privacy" },
  { href: "/coming-soon", label: "Terms" },
  { href: "/coming-soon", label: "Contact" },
] as const;

export async function SiteFooter() {
  const stores = await catalogOrEmpty(
    () => listPopularMerchants({ market: MARKET, limit: 6 }),
    [],
  );

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <p className="font-display text-lg font-extrabold text-slate-900">
              Affiliate<span className="text-[#10B981]">Hub</span>
            </p>
            <p className="text-sm leading-relaxed text-slate-500">
              Verified coupons and deals for US shoppers. Every code is tracked
              through our secure redirects.
            </p>
            <nav aria-label="Company" className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
              {company.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-sm text-slate-500 hover:text-emerald-600"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
              Top stores
            </h2>
            <ul className="space-y-2">
              {stores.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/store/${s.slug}`}
                    className="text-sm text-slate-500 hover:text-emerald-600"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/stores"
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  All stores
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
              Categories
            </h2>
            <p className="text-sm text-slate-500">Coming soon.</p>
            <Link
              href="/categories"
              className="mt-2 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Browse categories
            </Link>
          </div>

          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
              Disclosure
            </h2>
            <p className="text-xs leading-relaxed text-slate-500">
              AffiliateHub is compensated by merchants when you click our links
              and make a purchase. This does not affect the price you pay. Offers
              may change or expire without notice; verify terms on the
              merchant&apos;s site.
            </p>
          </div>
        </div>
        <p className="mt-10 border-t border-slate-100 pt-6 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} AffiliateHub. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
