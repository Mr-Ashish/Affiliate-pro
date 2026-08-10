import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { MerchantAvatar } from "@/components/public/MerchantAvatar";
import { listActiveMerchants } from "@/lib/catalog/merchants";
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
  const merchants = await listActiveMerchants({
    market: MARKET,
    q: needle || undefined,
  });

  return (
    <main>
      <Container className="space-y-8 py-10">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Stores</h1>
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
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {merchants.map((m) => (
              <li key={m.id}>
                <Link href={`/store/${m.slug}`}>
                  <Card hover className="flex items-center gap-3 p-4">
                    <MerchantAvatar name={m.name} logoUrl={m.logoUrl} />
                    <div>
                      <p className="font-semibold text-on-surface">{m.name}</p>
                      <p className="text-sm text-on-surface-variant">{m.slug}</p>
                    </div>
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
