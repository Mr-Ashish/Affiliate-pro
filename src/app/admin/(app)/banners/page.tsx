import Link from "next/link";
import { listBanners } from "@/lib/catalog/banners";

export default async function AdminBannersPage() {
  const banners = await listBanners();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Banners</h1>
        <Link href="/admin/banners/new" className="text-sm font-semibold text-primary">
          New banner
        </Link>
      </div>
      {banners.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No banners yet.</p>
      ) : (
        <ul className="space-y-2">
          {banners.map((banner) => (
            <li key={banner.id} className="rounded-md border border-outline-variant px-3 py-2 text-sm">
              {banner.title} · {banner.linkType} · {banner.isActive ? "active" : "inactive"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
