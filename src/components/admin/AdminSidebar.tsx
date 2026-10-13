import Link from "next/link";
import {
  LayoutDashboard,
  Store,
  Tags,
  Newspaper,
  Image as ImageIcon,
  Ticket,
  MousePointerClick,
  Plus,
  LogOut,
} from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/ui/cn";

export type AdminSidebarProps = {
  activePath?: string;
  logoutAction?: () => Promise<void>;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  disabled?: boolean;
};

const nav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/merchants", label: "Merchants", icon: Store },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: Tags,
    disabled: true,
  },
  { href: "/admin/posts", label: "Posts", icon: Newspaper },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/offers", label: "Offers", icon: Ticket },
  {
    href: "/admin/clicks",
    label: "Clicks",
    icon: MousePointerClick,
    disabled: true,
  },
];

export function AdminSidebar({
  activePath = "/admin",
  logoutAction,
}: AdminSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] flex-col border-r border-outline-variant/60 bg-surface-lowest p-4 md:flex">
      <div className="mb-6 px-2">
        <p className="text-lg font-bold text-primary-deep">Admin Panel</p>
        <p className="text-xs text-on-surface-variant">AffiliateHub</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1" aria-label="Admin">
        {nav.map((item) => {
          const active = item.exact
            ? activePath === item.href
            : activePath === item.href ||
              activePath.startsWith(`${item.href}/`);
          if (item.disabled) {
            return (
              <span
                key={item.label}
                className="flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface-variant/50"
                title="Coming soon"
              >
                <Icon icon={item.icon} size={18} />
                {item.label}
                <span className="ml-auto text-[10px] uppercase">Soon</span>
              </span>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-high",
              )}
            >
              <Icon icon={item.icon} size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 space-y-2 border-t border-outline-variant/40 pt-4">
        <Link href="/admin/offers/new" className="block">
          <Button variant="secondary" size="sm" className="w-full">
            <Icon icon={Plus} size={16} />
            Add Offer
          </Button>
        </Link>
        {logoutAction ? (
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
            >
              <Icon icon={LogOut} size={16} />
              Logout
            </Button>
          </form>
        ) : null}
      </div>
    </aside>
  );
}
