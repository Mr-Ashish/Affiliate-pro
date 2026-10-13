import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { MaterialIcon } from "@/components/public/MaterialIcon";
import { MerchantAvatar } from "@/components/public/MerchantAvatar";
import { listDirectoryMerchants } from "@/lib/catalog/merchants";
const MARKET = "US";

/** Must be a numeric literal for Next.js (see PUBLIC_PAGE_REVALIDATE_SECONDS). */
export const revalidate = 120;

export const metadata = {
  title: "Stores",
};

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const needle = (q ?? "").trim();
  const merchants = await listDirectoryMerchants({
    market: MARKET,
    q: needle || undefined,
  });

  return (
    <main>
      <Container className="space-y-10 py-10">
        <div>
          <h1 className="text-3xl font-bold text-on-surface md:text-4xl">Stores</h1>
          <p className="mt-1 text-on-surface-variant">
            Browse merchants with active US offers.
            {needle ? (
              <>
                {" "}
                Results for <strong>{q}</strong>.
              </>
            ) : null}
          </p>
        </div>

        {merchants.length === 0 ? (
          <p className="text-on-surface-variant">No stores found.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {merchants.map((m) => (
              <li key={m.id}>
                <Link href={`/store/${m.slug}`}>
                  <Card hover className="flex items-center gap-4 rounded-2xl p-4">
                    <MerchantAvatar name={m.name} logoUrl={m.logoUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-on-surface">{m.name}</p>
                      <p className="text-sm font-semibold text-primary-deep">
                        {m.offerCount} {m.offerCount === 1 ? "offer" : "offers"}
                      </p>
                    </div>
                    <MaterialIcon name="chevron_right" size={20} className="text-on-surface-variant" />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </main>
  );
}
