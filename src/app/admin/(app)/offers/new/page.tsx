import Link from "next/link";
import { createOfferAction } from "@/app/admin/actions";
import { listMerchants } from "@/lib/catalog/merchants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export default async function AdminNewOfferPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const merchants = await listMerchants();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="mb-2 text-sm">
          <Link
            href="/admin/offers"
            className="font-medium text-primary hover:underline"
          >
            ← Offers
          </Link>
        </p>
        <h1 className="text-2xl font-bold text-on-surface">New offer</h1>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-error-container px-3 py-2 text-sm text-error"
        >
          Error: {error}
        </p>
      ) : null}

      {merchants.length === 0 ? (
        <p className="text-sm text-on-surface-variant">
          No merchants yet.{" "}
          <Link
            href="/admin/merchants/new"
            className="text-primary hover:underline"
          >
            Create a merchant
          </Link>{" "}
          first.
        </p>
      ) : (
        <Card className="p-6">
          <form action={createOfferAction} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="merchantId" className="text-sm font-medium">
                Merchant
              </label>
              <Select id="merchantId" name="merchantId" required defaultValue="">
                <option value="" disabled>
                  Select merchant…
                </option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.market}/{m.slug})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input id="title" name="title" type="text" required />
            </div>
            <div className="space-y-1">
              <label htmlFor="offerType" className="text-sm font-medium">
                Offer type
              </label>
              <Select id="offerType" name="offerType" defaultValue="coupon">
                <option value="coupon">coupon</option>
                <option value="deal">deal</option>
                <option value="sale">sale</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="code" className="text-sm font-medium">
                Code (optional)
              </label>
              <Input id="code" name="code" type="text" />
            </div>
            <div className="space-y-1">
              <label htmlFor="affiliateUrl" className="text-sm font-medium">
                Affiliate URL
              </label>
              <Input
                id="affiliateUrl"
                name="affiliateUrl"
                type="url"
                required
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input id="description" name="description" type="text" />
            </div>
            <div className="space-y-1">
              <label htmlFor="discountLabel" className="text-sm font-medium">Discount label</label>
              <Input id="discountLabel" name="discountLabel" type="text" placeholder="10% OFF" />
            </div>
            <div className="space-y-1">
              <label htmlFor="imageUrl" className="text-sm font-medium">Image URL</label>
              <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://…" />
            </div>
            <div className="space-y-1">
              <label htmlFor="channel" className="text-sm font-medium">Channel</label>
              <Select id="channel" name="channel" defaultValue="">
                <option value="">—</option>
                <option value="online">online</option>
                <option value="in_store">in store</option>
                <option value="both">both</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="terms" className="text-sm font-medium">Terms</label>
              <Input id="terms" name="terms" type="text" />
            </div>
            <label className="flex items-center gap-2 text-sm"><input name="isFeatured" type="checkbox" /> Featured</label>
            <label className="flex items-center gap-2 text-sm"><input name="isExclusive" type="checkbox" /> Exclusive</label>
            <div className="space-y-1">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select id="status" name="status" defaultValue="active">
                <option value="active">active</option>
                <option value="draft">draft</option>
                <option value="expired">expired</option>
                <option value="disabled">disabled</option>
              </Select>
            </div>
            <Button type="submit" variant="primary">
              Create offer
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
