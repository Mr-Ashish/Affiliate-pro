import Link from "next/link";
import { createBannerAction } from "@/app/admin/actions";
import { listMerchants } from "@/lib/catalog/merchants";
import { listOffers } from "@/lib/catalog/offers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export default async function AdminNewBannerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [merchants, offers] = await Promise.all([listMerchants(), listOffers()]);
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <p className="text-sm">
        <Link href="/admin/banners" className="font-medium text-primary">← Banners</Link>
      </p>
      <h1 className="text-2xl font-bold">New banner</h1>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      <Card className="p-6">
        <form action={createBannerAction} className="space-y-4">
          <label className="block text-sm">Title<Input name="title" required /></label>
          <label className="block text-sm">Subtitle<Input name="subtitle" /></label>
          <label className="block text-sm">Image URL<Input name="imageUrl" type="url" required /></label>
          <label className="block text-sm">CTA<Input name="ctaLabel" required defaultValue="Get Code" /></label>
          <label className="block text-sm">
            Link type
            <Select name="linkType" defaultValue="store">
              <option value="store">store</option>
              <option value="offer">offer</option>
            </Select>
          </label>
          <label className="block text-sm">
            Store
            <Select name="merchantId" defaultValue="">
              <option value="">—</option>
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>{merchant.name}</option>
              ))}
            </Select>
          </label>
          <label className="block text-sm">
            Offer
            <Select name="offerId" defaultValue="">
              <option value="">—</option>
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>{offer.title}</option>
              ))}
            </Select>
          </label>
          <label className="block text-sm">Order<Input name="sortOrder" type="number" defaultValue="0" /></label>
          <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked /> Active</label>
          <label className="flex items-center gap-2 text-sm"><input name="isSponsored" type="checkbox" /> Sponsored</label>
          <Button type="submit">Create banner</Button>
        </form>
      </Card>
    </div>
  );
}
