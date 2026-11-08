import Link from "next/link";
import { BrandWordmark } from "@/components/public/BrandLogo";
import { Container } from "@/components/ui/Container";
import { SITE_NAME } from "@/lib/brand";
import { listPublicCategories } from "@/lib/catalog/categories";
import { listPopularMerchants } from "@/lib/catalog/merchants";
import { catalogOrEmpty } from "@/lib/db-prerender";
import { marketPath } from "@/lib/market/path";

const company = [
  { href: "/coming-soon", label: "About" },
  { href: "/coming-soon", label: "Privacy" },
  { href: "/coming-soon", label: "Terms" },
  { href: "/coming-soon", label: "Contact" },
] as const;

export async function SiteFooter({ market }: { market: string }) {
  const [stores, categories] = await Promise.all([
    catalogOrEmpty(() => listPopularMerchants({ market, limit: 6 }), []),
    catalogOrEmpty(() => listPublicCategories(market), []),
  ]);

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <BrandWordmark className="h-9 w-auto" />
            <p className="text-sm leading-relaxed text-slate-500">
              Verified coupons and deals for US shoppers. Every code is tracked
              through our secure redirects.
            </p>
            <nav aria-label="Company" className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
              {company.map((l) => (
                <Link
                  key={l.label}
                  href={marketPath(market, l.href)}
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
                    href={marketPath(market, `/store/${s.slug}`)}
                    className="text-sm text-slate-500 hover:text-emerald-600"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={marketPath(market, "/stores")}
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
            <ul className="space-y-2">
              {categories.slice(0, 8).map((category) => (
                <li key={category.id}>
                  <Link
                    href={marketPath(market, `/category/${category.slug}`)}
                    className="text-sm text-slate-500 hover:text-emerald-600"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={marketPath(market, "/categories")}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Browse categories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
              Disclosure
            </h2>
            <p className="text-xs leading-relaxed text-slate-500">
              {SITE_NAME} is compensated by merchants when you click our links
              and make a purchase. This does not affect the price you pay. Offers
              may change or expire without notice; verify terms on the
              merchant&apos;s site.
            </p>
          </div>
        </div>
        <p className="mt-10 border-t border-slate-100 pt-6 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
