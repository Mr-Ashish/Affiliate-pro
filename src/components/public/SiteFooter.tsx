import Link from "next/link";
import { Container } from "@/components/ui/Container";

const links = [
  { href: "/coming-soon", label: "About" },
  { href: "/coming-soon", label: "Privacy" },
  { href: "/coming-soon", label: "Terms" },
  { href: "/coming-soon", label: "Contact" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-outline-variant/60 bg-surface-low">
      <Container className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-black text-primary-deep">AffiliateHub</p>
          <p className="text-sm text-on-surface-variant">
            Verified coupons and deals for US shoppers.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-4">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-on-surface-variant hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
